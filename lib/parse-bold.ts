export interface TextPart {
  text: string;
  bold: boolean;
}

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
