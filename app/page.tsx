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
import { cn } from "@/lib/utils";
import Image from "next/image";
import { SunIcon, MoonIcon, DownloadIcon } from "@radix-ui/react-icons";

function LoaderIcon() {
  return (
    <svg
      className="mr-2 h-4 w-4 animate-spin text-current"
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

export default function Home() {
  const [text, setText] = useState("");
  const [color, setColor] = useState(colorOptions[0].value);
  const [fontSize, setFontSize] = useState(50);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState(false);

  const { setTheme, resolvedTheme } = useTheme();
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
      setDownloaded(false); // Reset download state on new image
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
    link.download = `miniature-potato-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloaded(true);

    // Reset download state after 5 seconds
    setTimeout(() => setDownloaded(false), 5000);
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
            aria-label="Toggle Dark Mode"
            className="shrink-0"
            tabIndex={0}
          >
            {mounted && resolvedTheme === "dark" ? (
              <SunIcon className="h-4 w-4" />
            ) : (
              <MoonIcon className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle Dark Mode</span>
          </Button>
        </div>
      </nav>

      <div className="pt-[64px]">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <main className="space-y-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="quote-text">Quote or Shayari</Label>
                <Textarea
                  id="quote-text"
                  placeholder="Start writing something lovely… use **text** for a touch of magic ✨"
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
                className={cn(
                  "w-full transition-colors duration-200 flex items-center justify-center",
                  !isLoading &&
                    !text.trim() &&
                    "bg-muted text-muted-foreground opacity-70 cursor-not-allowed",
                )}
                disabled={isLoading || !text.trim()}
              >
                {isLoading && <LoaderIcon />}
                {isLoading ? "Generating" : "Generate Image"}
              </Button>
            </form>

            {error && (
              <div className="p-4 border border-destructive bg-destructive/10 text-destructive rounded-md">
                {error}
              </div>
            )}

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">Preview</h2>
              <div className="aspect-square w-full rounded-lg border overflow-hidden bg-muted/30 relative">
                {isLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt="Quote or shayari image generated with Miniature Potato"
                    className="object-contain transition-opacity duration-500"
                    style={{ opacity: isLoading ? 0.5 : 1 }}
                    draggable={false}
                    fill
                    sizes="(max-width: 640px) 100vw, 512px"
                    priority
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Your image will appear here
                  </div>
                )}
              </div>

              {imageUrl && (
                <Button
                  onClick={handleDownload}
                  className={cn(
                    "w-full transition-colors duration-200 flex items-center justify-center gap-2",
                    downloaded &&
                      "bg-muted text-muted-foreground opacity-70 cursor-not-allowed",
                  )}
                  disabled={downloaded}
                >
                  <DownloadIcon className="h-4 w-4" />
                  Download Image
                </Button>
              )}
            </section>
          </main>

          <footer className="mt-12 border-t pt-6 text-center text-sm text-muted-foreground">
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
