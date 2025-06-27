import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const promptTemplate = (userText: string) => `
You are an assistant that helps creators find perfect background music for Instagram posts featuring shayari or quotes.

🎯 Your job:
Given a **shayari or quote**, analyze the emotional theme and suggest **up to 3 songs** that match the vibe.

📋 For each song, return:
- \`title\`
- \`artist\`
- \`timestamp\`
- \`lyric\`
- \`highlyRecommended\`: true for the best match

🎵 Output the final result only in valid JSON format.

---

📝 Example Input:
Jab, chhorr ke, jaana hi tha,
Toh, hamari jindagi mein, aaye hi kyon the?
Jab, saath nibhana hi, nahi tha,
Toh, sath rahne ka, wada kiya hi kyon tha?
Jab, iss tarah, hame bhulana hi tha,
To mile hi, kyon the?

Jab, aise badalna hi tha,
Toh hame, apna dost, banaya hi kyon tha?
Jab, hame khud se, aur khud ko hamse, durr karna hi tha,
Toh, duriyan kam kiya hi, kyon tha?

---

💡 Now do the same for:

${userText}

---

✅ Expected Output Example (JSON):
\`\`\`json
{
  "recommendations": [
    {
      "title": "Bhula Dena",
      "artist": "Mustafa Zahid",
      "timestamp": "0:40 – Chorus",
      "lyric": "Bhula dena mujhe, hai alvida tujhe",
      "highlyRecommended": true
    },
    {
      "title": "Phir Bhi Tumko Chaahunga",
      "artist": "Arijit Singh",
      "timestamp": "0:30 – Intro",
      "lyric": "Pal do pal ki kyun hai zindagi…",
      "highlyRecommended": false
    },
    {
      "title": "Agar Tum Saath Ho",
      "artist": "Alka Yagnik, Arijit Singh",
      "timestamp": "1:15 – Chorus",
      "lyric": "Tere bina guzara, ae dil hai mushkil",
      "highlyRecommended": false
    }
  ]
}
\`\`\`
`;

export async function POST(req: NextRequest) {
  const { userText } = await req.json();

  const openai = new OpenAI({
    apiKey: process.env.GITHUB_TOKEN!,
    baseURL: "https://models.github.ai/inference",
  });

  try {
    const completion = await openai.chat.completions.create({
      model: "openai/gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You help creators choose songs that match their quotes or shayari. Return only valid JSON in the exact structure.",
        },
        {
          role: "user",
          content: promptTemplate(userText),
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = completion.choices?.[0]?.message?.content || "";

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
