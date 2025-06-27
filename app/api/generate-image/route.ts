import { type NextRequest, NextResponse } from "next/server";
import { colorOptions } from "@/lib/color-options";
import { parseDoubleAsteriskBold, TextPart, wrapTextParts } from "@/lib/utils";
import path from "path";
import type { Canvas, SKRSContext2D } from "@napi-rs/canvas";

let GlobalFonts: typeof import("@napi-rs/canvas").GlobalFonts | undefined;
let createCanvas: typeof import("@napi-rs/canvas").createCanvas | undefined;

let hasBold = false;
let hasEmojiFont = false;

async function initializeCanvas() {
  try {
    const canvas = await import("@napi-rs/canvas");
    createCanvas = canvas.createCanvas;
    GlobalFonts = canvas.GlobalFonts;
    const AMATIC_REGULAR_PATH = path.resolve(
      process.cwd(),
      "fonts/AmaticSC-Regular.ttf",
    );
    const AMATIC_BOLD_PATH = path.resolve(
      process.cwd(),
      "fonts/AmaticSC-Bold.ttf",
    );
    const DAILY_BUBBLE_PATH = path.resolve(
      process.cwd(),
      "fonts/DailyBubble.ttf",
    );
    const EMOJI_FONT_PATH = path.resolve(
      process.cwd(),
      "fonts/NotoColorEmoji-Regular.ttf",
    );

    GlobalFonts.registerFromPath(AMATIC_REGULAR_PATH, "Amatic SC");
    GlobalFonts.registerFromPath(DAILY_BUBBLE_PATH, "Daily Bubble");
    try {
      GlobalFonts.registerFromPath(AMATIC_BOLD_PATH, "Amatic SC Bold");
      hasBold = true;
    } catch {
      hasBold = false;
    }
    try {
      GlobalFonts.registerFromPath(EMOJI_FONT_PATH, "Noto Color Emoji");
      hasEmojiFont = true;
    } catch {
      hasEmojiFont = false;
    }
    return true;
  } catch (error) {
    console.error("Failed to initialize canvas:", error);
    return false;
  }
}

function getWatermarkStyle(bgColor: string): {
  fillStyle: string;
  shadowColor: string;
  shadowBlur: number;
} {
  const colorObj = colorOptions.find(
    (c) =>
      c.value.toLowerCase() === bgColor.toLowerCase() ||
      c.name.toLowerCase() === bgColor.toLowerCase(),
  );
  const alpha = colorObj?.watermarkAlpha ?? 0.13;
  return {
    fillStyle: `rgba(255,255,255,${alpha})`,
    shadowColor: "rgba(0,0,0,0)",
    shadowBlur: 0,
  };
}

export async function POST(request: NextRequest) {
  try {
    const initialized = await initializeCanvas();
    if (!initialized) throw new Error("Failed to initialize canvas");

    const { text, bgColor = "#94F6BC", fontSize = 40 } = await request.json();

    const width = 1080;
    const height = 1080;
    const maxTextWidth = 775;
    const maxLines = 12;
    const footerFontSizePx = 32;
    const footerMargin = 12;

    const regularFont = hasEmojiFont
      ? `${fontSize}px "Amatic SC", "Noto Color Emoji"`
      : `${fontSize}px "Amatic SC"`;
    const boldFont = hasBold
      ? hasEmojiFont
        ? `${fontSize}px "Amatic SC Bold", "Noto Color Emoji"`
        : `${fontSize}px "Amatic SC Bold"`
      : hasEmojiFont
        ? `bold ${fontSize}px "Amatic SC", "Noto Color Emoji"`
        : `bold ${fontSize}px "Amatic SC"`;
    const watermarkFont = "Daily Bubble";
    const watermarkText = "words and true hearts";
    const footerText = "@words.and.true.hearts ";

    if (!createCanvas) throw new Error("Canvas not initialized");
    const canvas: Canvas = createCanvas(width, height);
    const ctx: SKRSContext2D = canvas.getContext("2d");

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // --- WATERMARK ---
    ctx.save();
    const diagLen = Math.sqrt(width * width + height * height);
    let fontPx = Math.floor(diagLen / 10.5);
    ctx.font = `bold ${fontPx}px "${watermarkFont}"`;
    let textWidth = ctx.measureText(watermarkText).width;

    while (textWidth < diagLen * 0.98 && fontPx < diagLen / 4) {
      fontPx += 2;
      ctx.font = `bold ${fontPx}px "${watermarkFont}"`;
      textWidth = ctx.measureText(watermarkText).width;
    }
    while (textWidth > diagLen && fontPx > 10) {
      fontPx -= 2;
      ctx.font = `bold ${fontPx}px "${watermarkFont}"`;
      textWidth = ctx.measureText(watermarkText).width;
    }

    ctx.translate(width / 2, height / 2);
    ctx.rotate(-Math.atan2(height, width));

    const { fillStyle, shadowColor, shadowBlur } = getWatermarkStyle(bgColor);
    ctx.font = `bold ${fontPx}px "${watermarkFont}"`;
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = shadowBlur;

    const spacing = fontPx + 24;
    const numLines = Math.ceil(diagLen / spacing);

    for (let i = -numLines; i <= numLines; i++) {
      ctx.fillStyle = fillStyle;
      ctx.fillText(watermarkText, -textWidth / 2, i * spacing);
    }
    ctx.shadowBlur = 0;
    ctx.restore();

    // --- MAIN TEXT ---
    ctx.save();

    const textParts: TextPart[] = parseDoubleAsteriskBold(text || "");

    const linesParsed: TextPart[][] = wrapTextParts(
      ctx,
      textParts,
      maxTextWidth,
      maxLines,
      regularFont,
      boldFont,
    );

    const mainAreaBottom = height - footerFontSizePx - footerMargin - 12;
    const mainAreaTop = 0;
    const textBlockHeight = linesParsed.length * Math.round(fontSize * 1.5);
    const startY =
      Math.floor((mainAreaBottom - mainAreaTop - textBlockHeight) / 2) +
      Math.round(fontSize * 1.5 * 0.85);

    const sideMargin = (width - maxTextWidth) / 2;
    const lineSpacing = Math.round(fontSize * 1.5);

    for (let i = 0; i < linesParsed.length; i++) {
      const parsed = linesParsed[i];
      let x = sideMargin;
      const y = startY + i * lineSpacing;
      if (parsed.length === 1 && parsed[0].text === "") {
        continue;
      }
      for (const part of parsed) {
        ctx.font = part.bold ? boldFont : regularFont;
        ctx.fillStyle = "#222";
        ctx.fillText(part.text, x, y);
        x += ctx.measureText(part.text).width;
      }
    }
    ctx.restore();

    // --- FOOTER ---
    ctx.save();
    ctx.font = hasEmojiFont
      ? `${footerFontSizePx}px "Amatic SC", "Noto Color Emoji"`
      : `${footerFontSizePx}px "Amatic SC"`;
    ctx.fillStyle = "#222";
    ctx.textAlign = "center";
    ctx.fillText(footerText, width / 2, height - footerMargin);
    ctx.restore();

    const buffer = await canvas.encode("png");
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate image",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
