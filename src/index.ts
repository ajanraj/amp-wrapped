#!/usr/bin/env bun

import * as p from "@clack/prompts";
import { join } from "node:path";
import os from "node:os";
import { parseArgs } from "node:util";

import { checkAmpDataExists, getAmpDataPath } from "./collector";
import { calculateAmpStats } from "./stats";
import { generateAmpImage } from "./image/generator";
import { displayInTerminal, getTerminalName } from "./terminal/display";
import { copyImageToClipboard } from "./clipboard";
import { isWrappedAvailable } from "./utils/dates";
import { formatNumber, formatNumberFull } from "./utils/format";
import type { AmpCodeStats } from "./types";

const VERSION = "1.0.0";

function printHelp() {
  console.log(`
amp-wrapped v${VERSION}

Generate your Amp Code year in review stats card.

USAGE:
  amp-wrapped [OPTIONS]

OPTIONS:
  --year <YYYY>    Generate wrapped for a specific year (default: current year)
  --help, -h       Show this help message
  --version, -v    Show version number

EXAMPLES:
  amp-wrapped              # Generate current year wrapped
  amp-wrapped --year 2025  # Generate 2025 wrapped
`);
}

async function main() {
  // Parse command line arguments
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      year: { type: "string", short: "y" },
      help: { type: "boolean", short: "h" },
      version: { type: "boolean", short: "v" },
    },
    strict: true,
    allowPositionals: false,
  });

  if (values.help) {
    printHelp();
    process.exit(0);
  }

  if (values.version) {
    console.log(`amp-wrapped v${VERSION}`);
    process.exit(0);
  }

  p.intro("amp wrapped");

  const requestedYear = values.year ? parseInt(values.year, 10) : new Date().getFullYear();

  const availability = isWrappedAvailable(requestedYear);
  if (!availability.available) {
    if (Array.isArray(availability.message)) {
      availability.message.forEach((line) => p.log.warn(line));
    } else {
      p.log.warn(availability.message || "Wrapped not available yet.");
    }
    p.cancel();
    process.exit(0);
  }

  const dataExists = await checkAmpDataExists();
  if (!dataExists) {
    p.cancel(`Amp data not found at ${getAmpDataPath()}\n\nMake sure you have used Amp at least once.`);
    process.exit(0);
  }

  const spinner = p.spinner();
  spinner.start("Scanning your Amp history...");

  let stats;
  try {
    stats = await calculateAmpStats(requestedYear);
  } catch (error) {
    spinner.stop("Failed to collect stats");
    p.cancel(`Error: ${error}`);
    process.exit(1);
  }

  if (stats.totalSessions === 0) {
    spinner.stop("No data found");
    p.cancel(`No Amp activity found for ${requestedYear}`);
    process.exit(0);
  }

  spinner.stop("Found your stats!");

  // Display summary
  const summaryLines = [
    `Threads:       ${formatNumber(stats.totalSessions)}`,
    `Messages:      ${formatNumber(stats.totalMessages)}`,
    `Total Tokens:  ${formatNumber(stats.totalTokens)}`,
    `Projects:      ${formatNumber(stats.totalProjects)}`,
    `Streak:        ${stats.maxStreak} days`,
    stats.hasCredits && `Credits Used:  ${stats.totalCredits.toFixed(2)}`,
    stats.mostActiveDay && `Most Active:   ${stats.mostActiveDay.formattedDate}`,
  ].filter(Boolean);

  p.note(summaryLines.join("\n"), `Your ${requestedYear} in Amp`);

  // Generate image
  spinner.start("Generating your wrapped image...");

  let image: { fullSize: Buffer; displaySize: Buffer };
  try {
    image = await generateAmpImage(stats);
  } catch (error) {
    spinner.stop("Failed to generate image");
    p.cancel(`Error generating image: ${error}`);
    process.exit(1);
  }

  spinner.stop("Image generated!");

  const displayed = await displayInTerminal(image.displaySize);
  if (!displayed) {
    p.log.info(`Terminal (${getTerminalName()}) doesn't support inline images`);
  }

  const filename = `amp-wrapped-${requestedYear}.png`;
  const { success, error } = await copyImageToClipboard(image.fullSize, filename);

  if (success) {
    p.log.success("Automatically copied image to clipboard!");
  } else {
    p.log.warn(`Clipboard unavailable: ${error}`);
    p.log.info("You can save the image to disk instead.");
  }

  const defaultPath = join(os.homedir(), filename);

  const shouldSave = await p.confirm({
    message: `Save image to ${defaultPath}?`,
    initialValue: true,
  });

  if (p.isCancel(shouldSave)) {
    p.outro("Cancelled");
    process.exit(0);
  }

  if (shouldSave) {
    try {
      await Bun.write(defaultPath, image.fullSize);
      p.log.success(`Saved to ${defaultPath}`);
    } catch (error) {
      p.log.error(`Failed to save: ${error}`);
    }
  }

  const shouldShare = await p.confirm({
    message: "Share on X (Twitter)? Don't forget to attach your image!",
    initialValue: true,
  });

  if (!p.isCancel(shouldShare) && shouldShare) {
    const tweetUrl = generateTweetUrl(stats);
    const opened = await openUrl(tweetUrl);
    if (opened) {
      p.log.success("Opened X in your browser.");
    } else {
      p.log.warn("Couldn't open browser. Copy this URL:");
      p.log.info(tweetUrl);
    }
    p.log.info("Press CMD / CTRL + V to paste the image.");
  }

  p.outro("Share your wrapped!");
  process.exit(0);
}

function generateTweetUrl(stats: AmpCodeStats): string {
  const lines: string[] = [];
  lines.push(`Amp Wrapped ${stats.year}`);
  lines.push("");
  lines.push(`Total Tokens: ${formatNumberFull(stats.totalTokens)}`);
  lines.push(`Total Messages: ${formatNumberFull(stats.totalMessages)}`);
  lines.push(`Total Threads: ${formatNumberFull(stats.totalSessions)}`);
  lines.push("");
  lines.push(`Longest Streak: ${stats.maxStreak} days`);
  lines.push(`Top model: ${stats.topModels[0]?.name ?? "N/A"}`);
  if (stats.hasCredits) {
    lines.push(`Total Credits: ${stats.totalCredits.toFixed(2)}`);
  }
  lines.push("");
  lines.push("Get yours: npx amp-wrapped");
  lines.push("");
  lines.push("(Paste Image Stats with CMD / CTRL + V)");

  const text = lines.join("\n");

  const url = new URL("https://x.com/intent/tweet");
  url.searchParams.set("text", text);
  return url.toString();
}

async function openUrl(url: string): Promise<boolean> {
  const platform = process.platform;

  try {
    let proc;

    if (platform === "darwin") {
      proc = Bun.spawn(["open", url], {
        stdout: "ignore",
        stderr: "ignore",
      });
    } else if (platform === "win32") {
      // 'start' is a shell built-in on Windows, must use cmd.exe
      // Empty string is the window title, URL must be quoted for special chars like &
      proc = Bun.spawn(["cmd.exe", "/c", `start "" "${url}"`], {
        stdout: "ignore",
        stderr: "ignore",
      });
    } else {
      proc = Bun.spawn(["xdg-open", url], {
        stdout: "ignore",
        stderr: "ignore",
      });
    }

    await proc.exited;
    return proc.exitCode === 0;
  } catch {
    return false;
  }
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
