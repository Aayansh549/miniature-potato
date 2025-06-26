import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
    body: JSON.stringify({
      text,
      bgColor,
      fontSize,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Failed to generate image");
  }

  return await response.blob();
}
