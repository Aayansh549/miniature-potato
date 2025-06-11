import { createCanvas } from "@napi-rs/canvas"
import { type NextRequest, NextResponse } from "next/server"

interface TextPart {
  text: string
  bold: boolean
}

function getContrastYIQ(hexcolor: string) {
  hexcolor = hexcolor.replace("#", "")
  const r = Number.parseInt(hexcolor.substr(0, 2), 16)
  const g = Number.parseInt(hexcolor.substr(2, 2), 16)
  const b = Number.parseInt(hexcolor.substr(4, 2), 16)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 128 ? "#222" : "#fff"
}

function parseMarkdownBold(line: string): TextPart[] {
  const result: TextPart[] = []
  let match
  let lastIndex = 0
  const regex = /\*\*(.*?)\*\*/g

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      result.push({ text: line.slice(lastIndex, match.index), bold: false })
    }
    result.push({ text: match[1], bold: true })
    lastIndex = regex.lastIndex
  }

  if (lastIndex < line.length) {
    result.push({ text: line.slice(lastIndex), bold: false })
  }

  return result
}

export async function POST(request: NextRequest) {
  try {
    const { text, bgColor = "#94F6BC", width = 1080, height = 1080 } = await request.json()

    const W = Math.max(300, Math.min(2000, Number(width)))
    const H = Math.max(300, Math.min(3000, Number(height)))

    const canvas = createCanvas(W, H)
    const ctx = canvas.getContext("2d")

    // Fill background
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, W, H)

    // Use system fonts
    const regularFont = "Arial"
    const boldFont = "Arial Bold"

    // Add watermark
    const watermark = "Words and True Hearts"
    ctx.save()
    ctx.translate(W / 2, H / 2)
    ctx.rotate(-Math.PI / 4)
    ctx.globalAlpha = 0.09
    ctx.font = `bold ${Math.round(W / 12)}px ${regularFont}`
    ctx.fillStyle = getContrastYIQ(bgColor)
    ctx.fillText(watermark, -W / 2, 0)
    ctx.restore()

    // Add footer
    const footerText = "@words.and.true.hearts"
    ctx.save()
    ctx.font = `italic 24px ${regularFont}`
    ctx.fillStyle = "#222"
    ctx.textAlign = "center"
    ctx.fillText(footerText, W / 2, H - 40)
    ctx.restore()

    // Process and draw main text
    ctx.save()
    const lines = String(text || "")
      .split("\n")
      .map((line) => line.trim())
    const linesParsed = lines.map(parseMarkdownBold)

    // Simple text rendering with fixed font size
    const fontSize = 48
    const lineHeight = fontSize * 1.5

    // Center text vertically
    const startY = (H - lines.length * lineHeight) / 2

    for (let i = 0; i < linesParsed.length; i++) {
      let lineWidth = 0

      // Calculate line width
      for (const part of linesParsed[i]) {
        ctx.font = part.bold ? `bold ${fontSize}px ${boldFont}` : `${fontSize}px ${regularFont}`
        lineWidth += ctx.measureText(part.text).width
      }

      // Center text horizontally
      let x = (W - lineWidth) / 2
      const y = startY + i * lineHeight

      // Draw each part of the line
      for (const part of linesParsed[i]) {
        ctx.font = part.bold ? `bold ${fontSize}px ${boldFont}` : `${fontSize}px ${regularFont}`
        ctx.fillStyle = "#222"
        ctx.fillText(part.text, x, y)
        x += ctx.measureText(part.text).width
      }
    }
    ctx.restore()

    const buffer = await canvas.encode("png")

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("Image generation error:", error)
    return NextResponse.json({ error: "Failed to generate image" }, { status: 500 })
  }
}
