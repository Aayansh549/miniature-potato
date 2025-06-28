import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Initialize OpenAI with the GitHub AI model
const openai = new OpenAI({
  apiKey: process.env.GITHUB_TOKEN!,
  baseURL: "https://models.github.ai/inference",
});

const promptTemplate = (userText: string) => `
Suggest up to 3 Hindi or Bollywood songs for this quote or shayari.

Respond ONLY with a pure JSON array. In your JSON, set "highlyRecommended": true for only ONE song, and false for the rest.

[
  {
    "title": "...",
    "artist": "...",
    "timestamp": "...",
    "lyric": "...",
    "highlyRecommended": true/false
  }
]

Input:
${userText}
`;

export async function POST(req: NextRequest) {
  const { userText } = await req.json();

  try {
    const completion = await openai.chat.completions.create({
      model: "openai/gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You assist creators by recommending songs that perfectly complement the mood and meaning of their quotes or shayari, enhancing emotional impact and audience engagement.",
        },
        {
          role: "user",
          content: promptTemplate(userText),
        },
      ],
      temperature: 0.7,
      max_tokens: 350,
    });

    const content = completion.choices?.[0]?.message?.content || "";

    console.log(content);

    const match = content.match(/```json\s*([\s\S]*?)\s*```/i);
    const jsonStr = match ? match[1].trim() : content.trim();

    try {
      const parsed = JSON.parse(jsonStr);
      return NextResponse.json(parsed);
    } catch {
      console.warn("❌ Failed to parse JSON:", jsonStr);
      return NextResponse.json(
        {
          error: "Could not parse song suggestion",
          raw: content,
        },
        { status: 500 },
      );
    }
  } catch (e) {
    console.error("OpenAI API call failed:", e);

    let errorMessage = "OpenAI API call failed";
    if (
      typeof e === "object" &&
      e !== null &&
      "message" in e &&
      typeof (e as { message?: unknown }).message === "string"
    ) {
      errorMessage = (e as { message: string }).message;
    } else if (typeof e === "string") {
      errorMessage = e;
    }

    return NextResponse.json(
      {
        error: errorMessage,
        raw: "",
      },
      { status: 500 },
    );
  }
}
