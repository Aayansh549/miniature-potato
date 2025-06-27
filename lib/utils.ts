import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { SKRSContext2D } from "@napi-rs/canvas";

/** --- CLASSNAMES --- */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** --- IMAGE GENERATION --- */
export async function generateImage(
  text: string,
  bgColor: string,
  fontSize: number,
): Promise<Blob> {
  const response = await fetch("/api/generate-image", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text, bgColor, fontSize }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Failed to generate image");
  }

  return await response.blob();
}

/** --- BOLD PARSING --- */
export interface TextPart {
  text: string;
  bold: boolean;
}

/**
 * Parses text for **bold** segments, returns array of TextPart
 */
export function parseDoubleAsteriskBold(text: string): TextPart[] {
  const result: TextPart[] = [];
  let lastIndex = 0;
  const regex = /\*\*(.*?)\*\*/gs;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      result.push({ text: text.slice(lastIndex, match.index), bold: false });
    }
    result.push({ text: match[1], bold: true });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    result.push({ text: text.slice(lastIndex), bold: false });
  }
  return result;
}

/** --- TEXT WRAPPING --- */
/**
 * Wraps and preserves explicit blank lines (from \n\n) and trailing blank lines.
 * Each line is an array of TextPart, empty array for blank lines.
 */
export function wrapTextParts(
  ctx: SKRSContext2D,
  parts: TextPart[],
  maxWidth: number,
  maxLines: number,
  regularFont: string,
  boldFont: string,
): TextPart[][] {
  const lines: TextPart[][] = [];
  let currentLine: TextPart[] = [];
  let currentLineWidth = 0;

  function pushLine() {
    lines.push(currentLine);
    currentLine = [];
    currentLineWidth = 0;
  }

  let i = 0;
  while (i < parts.length && lines.length < maxLines) {
    const part = parts[i];
    let text = part.text;

    while (text.length > 0 && lines.length < maxLines) {
      const newlineIdx = text.indexOf("\n");
      let slice = text;
      let rest = "";
      if (newlineIdx !== -1) {
        slice = text.slice(0, newlineIdx);
        rest = text.slice(newlineIdx + 1);
      }

      const words = slice.split(/(\s+)/);
      for (const word of words) {
        if (word === "") continue;
        ctx.font = part.bold ? boldFont : regularFont;
        const wordWidth = ctx.measureText(word).width;
        if (currentLineWidth + wordWidth > maxWidth && currentLine.length > 0) {
          pushLine();
          if (lines.length >= maxLines) return lines;
        }
        currentLine.push({ text: word, bold: part.bold });
        currentLineWidth += wordWidth;
      }

      if (newlineIdx !== -1) {
        pushLine();
        if (lines.length >= maxLines) return lines;
        text = rest;

        while (text.startsWith("\n") && lines.length < maxLines) {
          lines.push([]);
          text = text.slice(1);
        }
      } else {
        text = "";
      }
    }
    i++;
  }

  if (
    (currentLine.length > 0 || lines.length === 0) &&
    lines.length < maxLines
  ) {
    lines.push(currentLine);
  }
  return lines.slice(0, maxLines);
}
