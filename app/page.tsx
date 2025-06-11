"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import ColorPicker from "@/components/color-picker"
import { generateImage } from "@/lib/utils"

export default function Home() {
  const [text, setText] = useState("")
  const [color, setColor] = useState("#94F6BC")
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentTime = new Date().toLocaleTimeString()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const imageBlob = await generateImage(text, color)
      const url = URL.createObjectURL(imageBlob)
      setImageUrl(url)
    } catch (err) {
      setError("Failed to generate image. Please try again.")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    if (!imageUrl) return

    const link = document.createElement("a")
    link.href = imageUrl
    link.download = `shayari-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <header className="mb-8 text-center">
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight">Words & True Hearts</h1>
        </header>

        <main className="space-y-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shayari">Your Shayari</Label>
              <Textarea
                id="shayari"
                placeholder="Type your shayari here... Use **text** for bold formatting"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[100px]"
                rows={Math.min(6, Math.max(3, text.split("\n").length))}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-end justify-between">
              <div className="w-full sm:w-[200px]">
                <Label htmlFor="color" className="block mb-2">
                  Background Color
                </Label>
                <ColorPicker color={color} setColor={setColor} />
              </div>

              <Button type="submit" disabled={isLoading || !text.trim()}>
                {isLoading ? "Generating..." : "Generate Image"}
              </Button>
            </div>
          </form>

          {error && (
            <div className="p-4 border border-destructive bg-destructive/10 text-destructive rounded-md">{error}</div>
          )}

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Preview</h2>
            <div className="aspect-square w-full rounded-lg border overflow-hidden bg-muted/30">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : imageUrl ? (
                <img
                  src={imageUrl || "/placeholder.svg"}
                  alt="Generated Shayari"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Your image will appear here
                </div>
              )}
            </div>

            {imageUrl && (
              <Button variant="outline" onClick={handleDownload} className="w-full">
                Download Image
              </Button>
            )}
          </div>
        </main>

        <footer className="mt-12 text-center text-sm text-muted-foreground">
          <p>Made with ❤️ by Aayansh</p>
          <p>{currentTime}</p>
        </footer>
      </div>
    </div>
  )
}
