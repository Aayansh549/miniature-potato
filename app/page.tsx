"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { colorOptions } from "@/lib/color-options";
import ColorPicker from "@/components/color-picker";
import { generateImage } from "@/lib/utils";

export default function Home() {
  const [text, setText] = useState("");
  const [color, setColor] = useState(colorOptions[0].value);
  const [fontSize, setFontSize] = useState(50);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const handleThemeToggle = () =>
    setTheme(resolvedTheme === "dark" ? "light" : "dark");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const imageBlob = await generateImage(text, color, fontSize);
      const url = URL.createObjectURL(imageBlob);
      setImageUrl(url);
    } catch (err) {
      setError("Failed to generate image. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `shayari-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 w-full z-40 bg-white/70 dark:bg-neutral-900/70 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 py-2">
          <span className="font-extrabold tracking-tight text-lg sm:text-xl">
            Miniature Potato
          </span>
          <Button
            variant="outline"
            onClick={handleThemeToggle}
            aria-label="Toggle dark mode"
            className="shrink-0"
            tabIndex={0}
          >
            {mounted && resolvedTheme === "dark" ? (
              // Sun icon
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M12 18a6 6 0 100-12 6 6 0 000 12z"
                />
                <path
                  fill="currentColor"
                  fillRule="evenodd"
                  d="M12 2a1 1 0 011 1v1a1 1 0 01-2 0V3a1 1 0 011-1zm0 16a1 1 0 011 1v1a1 1 0 01-2 0v-1a1 1 0 011-1zm10-7a1 1 0 01-1 1h-1a1 1 0 010-2h1a1 1 0 011 1zM4 12a1 1 0 01-1 1H2a1 1 0 110-2h1a1 1 0 011 1zm13.657-7.071a1 1 0 010 1.414l-.708.707a1 1 0 11-1.415-1.414l.708-.707a1 1 0 011.415 0zM6.343 17.657a1 1 0 010 1.415l-.707.707a1 1 0 11-1.415-1.414l.707-.708a1 1 0 011.415 0zm11.314 1.415a1 1 0 01-1.415 0l-.707-.708a1 1 0 111.414-1.415l.708.708a1 1 0 010 1.415zM6.343 6.343a1 1 0 01-1.415 0l-.707-.707A1 1 0 116.636 4.22l.707.707a1 1 0 010 1.415z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              // Moon icon
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"
                />
              </svg>
            )}
            <span className="sr-only">Toggle dark mode</span>
          </Button>
        </div>
      </nav>

      <div className="pt-[64px]">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <main className="space-y-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="shayari">Text</Label>
                <Textarea
                  id="shayari"
                  placeholder="Type your shayari or quote here… use **text** to make it bold ✨"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="min-h-[100px]"
                  rows={Math.min(6, Math.max(3, text.split("\n").length))}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Font Size</Label>
                  <Slider
                    value={[fontSize]}
                    onValueChange={(values) => setFontSize(values[0])}
                    min={30}
                    max={100}
                    step={2}
                    className="w-full"
                  />
                  <div className="text-sm text-muted-foreground text-center">
                    {fontSize}px
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Background Color</Label>
                  <ColorPicker color={color} setColor={setColor} />
                </div>
              </div>

              <Button
                type="submit"
                className={
                  "w-full transition-colors duration-200 " +
                  (isLoading || !text.trim()
                    ? "bg-muted text-muted-foreground opacity-70 cursor-not-allowed"
                    : "")
                }
                disabled={isLoading || !text.trim()}
              >
                {isLoading ? "Generating..." : "Generate Image"}
              </Button>
            </form>

            {error && (
              <div className="p-4 border border-destructive bg-destructive/10 text-destructive rounded-md">
                {error}
              </div>
            )}

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">Preview</h2>
              <div className="aspect-square w-full rounded-lg border overflow-hidden bg-muted/30">
                {isLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Generated Shayari"
                    className="w-full h-full object-contain transition-opacity duration-500"
                    style={{ opacity: isLoading ? 0.5 : 1 }}
                    draggable={false}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Your image will appear here
                  </div>
                )}
              </div>

              {imageUrl && (
                <Button
                  variant="outline"
                  onClick={handleDownload}
                  className="w-full"
                >
                  Download Image
                </Button>
              )}
            </section>
          </main>

          <footer className="mt-12 text-center text-sm text-muted-foreground">
            <p>
              Made by Aayansh with{" "}
              <span aria-label="love" role="img">
                ❤️
              </span>
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
