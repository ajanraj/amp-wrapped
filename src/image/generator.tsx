import satori from "satori";
import { Resvg, initWasm } from "@resvg/resvg-wasm";
import resvgWasm from "@resvg/resvg-wasm/index_bg.wasm";
import { AmpWrappedTemplate } from "./template";
import type { AmpCodeStats } from "../types";
import { loadFonts } from "./fonts";
import { ampLayout } from "./design-tokens";

export interface GeneratedImage {
  /** Full resolution PNG buffer for saving/clipboard */
  fullSize: Buffer;
  /** Scaled PNG buffer for terminal display (80% of full size) */
  displaySize: Buffer;
}

export async function generateAmpImage(stats: AmpCodeStats): Promise<GeneratedImage> {
  await initWasm(Bun.file(resvgWasm).arrayBuffer());

  const svg = await satori(<AmpWrappedTemplate stats={stats} />, {
    width: ampLayout.canvas.width,
    height: ampLayout.canvas.height,
    fonts: await loadFonts(),
  });

  const [fullSize, displaySize] = [1, 0.75].map((v) => {
    const resvg = new Resvg(svg, {
      fitTo: {
        mode: "zoom",
        value: v,
      },
    });
    return Buffer.from(resvg.render().asPng());
  });

  return { fullSize, displaySize };
}
