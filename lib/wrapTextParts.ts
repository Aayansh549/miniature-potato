import type { SKRSContext2D } from "@napi-rs/canvas";
import type { TextPart } from "@/lib/parse-bold";

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
