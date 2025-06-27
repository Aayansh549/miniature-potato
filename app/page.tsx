"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { colorOptions } from "@/lib/color-options";
import AlertCard from "@/components/alert-card";
import ColorPicker from "@/components/color-picker";
import {
  cn,
  generateImage,
  getSongSuggestions,
  SongRecommendation,
  songErrorMap,
  normalizeText,
} from "@/lib/utils";
import Image from "next/image";
import {
  SunIcon,
  MoonIcon,
  DownloadIcon,
  StarFilledIcon,
  CheckIcon,
} from "@radix-ui/react-icons";

// — UTILS —
function isSongRecommendationArray(val: unknown): val is SongRecommendation[] {
  return (
    Array.isArray(val) &&
    val.every(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof item.title === "string" &&
        typeof item.artist === "string" &&
        typeof item.timestamp === "string" &&
        typeof item.lyric === "string" &&
        typeof item.highlyRecommended === "boolean",
    )
  );
}

function LoaderIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={cn("mr-2 h-4 w-4 animate-spin text-current", className)}
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
      style={{ animationDuration: "1.1s" }}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

// — SONG CARD —
function SongCard({
  song,
  isFirst,
}: {
  song: SongRecommendation;
  isFirst: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4 flex flex-col gap-3 bg-card transition-all duration-300 hover:shadow-md",
        song.highlyRecommended && isFirst
          ? "border-primary/30 shadow-sm shadow-primary/5 bg-primary/5"
          : "border-border hover:border-border/80",
      )}
    >
      <div className="flex items-center gap-2">
        {song.highlyRecommended && isFirst && (
          <span
            className="text-primary flex-shrink-0"
            title="Highly Recommended"
          >
            <StarFilledIcon className="w-4 h-4" />
          </span>
        )}
        <h3 className="font-semibold text-base leading-tight text-foreground">
          {song.title}
        </h3>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground font-medium">{song.artist}</span>
        <span className="inline-flex items-center gap-1 bg-muted text-muted-foreground px-2 py-1 rounded-md text-xs font-medium">
          {song.timestamp}
        </span>
      </div>
      <blockquote className="border-l-2 border-muted-foreground/30 pl-3 italic text-muted-foreground text-sm leading-relaxed">
        "{song.lyric}"
      </blockquote>
    </div>
  );
}

// — SONG SKELETON CARD —
function SongSkeletonCard() {
  return (
    <div
      className="rounded-lg border border-border p-4 flex flex-col gap-3 bg-card animate-pulse"
      style={{ animationDuration: "1.5s" }}
    >
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full bg-muted animate-pulse" />
        <div className="h-4 w-3/5 bg-muted rounded animate-pulse" />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-3 w-1/3 bg-muted/70 rounded animate-pulse" />
        <div className="h-6 w-20 bg-muted/50 rounded animate-pulse" />
      </div>
      <div className="h-3 w-full bg-muted/30 rounded animate-pulse" />
    </div>
  );
}

function getSongSuggestionErrorDisplay(error?: string) {
  if (!error) return null;
  for (const key in songErrorMap) {
    if (songErrorMap[key].match(error)) {
      return <AlertCard message={songErrorMap[key].message} />;
    }
  }
  // Default fallback
  return <AlertCard message={error} />;
}

// — MAIN —
export default function Home() {
  const [text, setText] = useState("");
  const [color, setColor] = useState(colorOptions[0].value);
  const [fontSize, setFontSize] = useState(50);

  // Image
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Song suggestions
  const [isSongLoading, setIsSongLoading] = useState(false);
  const [songResult, setSongResult] = useState<SongRecommendation[] | null>(
    null,
  );
  const [songError, setSongError] = useState<string | null>(null);

  // Section persistence: show after first generate, never hide again
  const [sectionsVisible, setSectionsVisible] = useState(false);

  // Last successful song recommendations (for "no text change" quick re-show)
  const [lastSongResult, setLastSongResult] = useState<
    SongRecommendation[] | null
  >(null);
  const [lastSongError, setLastSongError] = useState<string | null>(null);

  // Download button effect
  const [downloaded, setDownloaded] = useState(false);

  // Prevent spam generates
  const [generateDisabled, setGenerateDisabled] = useState(false);

  // AbortController refs
  const imageAbortController = useRef<AbortController | null>(null);
  const songAbortController = useRef<AbortController | null>(null);
  const songRequestInFlightFor = useRef<string | null>(null);

  // Refs
  const downloadTimeout = useRef<NodeJS.Timeout | null>(null);
  const prevBlobUrl = useRef<string | null>(null);
  const lastFetchedText = useRef<string | null>(null);
  const firstGenerate = useRef<boolean>(true);

  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Clean up blob URLs and timers on unmount
  useEffect(() => {
    return () => {
      if (prevBlobUrl.current) URL.revokeObjectURL(prevBlobUrl.current);
      if (downloadTimeout.current) clearTimeout(downloadTimeout.current);
      imageAbortController.current?.abort();
      songAbortController.current?.abort();
    };
  }, []);

  const handleThemeToggle = () =>
    setTheme(resolvedTheme === "dark" ? "light" : "dark");

  // --- Handle Submit ---
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // TEXT CLEANUP
    const cleanedText = text
      .split("\n")
      .map((line) => line.trimEnd())
      .join("\n")
      .replace(/\s+$/g, "")
      .replace(/^\s+/g, "");
    setText(cleanedText);

    // Prevent spam taps for 0.5s
    setGenerateDisabled(true);
    setTimeout(() => setGenerateDisabled(false), 500);

    // SECTION PERSISTENCE
    if (!sectionsVisible) setSectionsVisible(true);

    // Always show image skeletons
    setIsImageLoading(true);
    setImageError(null);
    setImageUrl(null);
    setImageLoaded(false);

    // Clean up old blobs
    if (prevBlobUrl.current) {
      URL.revokeObjectURL(prevBlobUrl.current);
      prevBlobUrl.current = null;
    }

    // Abort previous image request
    imageAbortController.current?.abort();

    const normalizedNow = normalizeText(cleanedText);
    const textChanged =
      normalizedNow && normalizedNow !== lastFetchedText.current;
    const isFirst = firstGenerate.current;
    if (firstGenerate.current) firstGenerate.current = false;

    if (textChanged || isFirst) {
      setIsSongLoading(true);
      setSongResult(null);
      setSongError(null);
      songAbortController.current?.abort();

      try {
        imageAbortController.current = new AbortController();
        const imageBlob = await generateImage(cleanedText, color, fontSize, {
          signal: imageAbortController.current.signal,
        });
        const url = URL.createObjectURL(imageBlob);
        setImageUrl(url);
        setDownloaded(false);
        prevBlobUrl.current = url;

        lastFetchedText.current = normalizedNow;
        songRequestInFlightFor.current = normalizedNow;

        setTimeout(async () => {
          try {
            songAbortController.current = new AbortController();
            const result = await getSongSuggestions(cleanedText, {
              signal: songAbortController.current.signal,
            });
            if (songRequestInFlightFor.current === normalizedNow) {
              if (
                result &&
                "recommendations" in result &&
                isSongRecommendationArray(result.recommendations)
              ) {
                setSongResult(result.recommendations);
                setLastSongResult(result.recommendations);
                setSongError(null);
                setLastSongError(null);
              } else {
                const errMsg =
                  typeof result?.error === "string"
                    ? result.error
                    : "Could not get song suggestions. Try adjusting your text or try again later.";
                setSongResult(null);
                setSongError(errMsg);
                setLastSongResult(null);
                setLastSongError(errMsg);
              }
            }
          } catch (err: any) {
            if (err?.name === "AbortError") return;
            setSongResult(null);
            setSongError(
              "Could not get song suggestions. Try adjusting your text or try again later.",
            );
            setLastSongResult(null);
            setLastSongError(
              "Could not get song suggestions. Try adjusting your text or try again later.",
            );
          }
          setIsSongLoading(false);
          songRequestInFlightFor.current = null;
        }, 0);
      } catch (err: any) {
        setImageError("Failed to generate image. Please try again.");
        setIsSongLoading(false); // Don't fetch songs if image fails
      } finally {
        setIsImageLoading(false);
      }
    } else {
      // If text is the same:
      if (isSongLoading) {
        // Song request is still in flight, just regen image, keep skeletons!
        try {
          imageAbortController.current = new AbortController();
          const imageBlob = await generateImage(cleanedText, color, fontSize, {
            signal: imageAbortController.current.signal,
          });
          const url = URL.createObjectURL(imageBlob);
          setImageUrl(url);
          setDownloaded(false);
          prevBlobUrl.current = url;
        } catch (err) {
          setImageError("Failed to generate image. Please try again.");
        } finally {
          setIsImageLoading(false);
        }
        return;
      } else {
        // Song suggestions are already loaded, show skeleton for 0.9s, then restore
        try {
          imageAbortController.current = new AbortController();
          const imageBlob = await generateImage(cleanedText, color, fontSize, {
            signal: imageAbortController.current.signal,
          });
          const url = URL.createObjectURL(imageBlob);
          setImageUrl(url);
          setDownloaded(false);
          prevBlobUrl.current = url;

          setIsSongLoading(true);
          setSongResult(null);
          setSongError(null);

          setTimeout(() => {
            setSongResult(lastSongResult);
            setSongError(lastSongError);
            setIsSongLoading(false);
          }, 900);
        } catch (err) {
          setImageError("Failed to generate image. Please try again.");
          setIsSongLoading(false);
        } finally {
          setIsImageLoading(false);
        }
      }
    }
  };

  const handleDownload = () => {
    if (!imageUrl || !imageLoaded) return;
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `miniature-potato-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloaded(true);
    if (downloadTimeout.current) clearTimeout(downloadTimeout.current);
    downloadTimeout.current = setTimeout(() => setDownloaded(false), 5000);
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
                  !isImageLoading &&
                    !text.trim() &&
                    "bg-muted text-muted-foreground opacity-70 cursor-not-allowed",
                  (isImageLoading || generateDisabled) &&
                    "opacity-90 cursor-wait",
                )}
                disabled={isImageLoading || !text.trim() || generateDisabled}
              >
                {isImageLoading && <LoaderIcon />}
                {isImageLoading ? "Generating" : "Generate"}
              </Button>
            </form>

            {imageError && (
              <div className="p-4 border border-destructive bg-destructive/10 text-destructive rounded-md">
                {imageError}
              </div>
            )}

            {sectionsVisible && (
              <>
                <section
                  className="space-y-4"
                  aria-live="polite"
                  aria-busy={isImageLoading}
                >
                  <h2 className="text-xl font-semibold">Preview</h2>
                  {/* Skeleton for image preview during generation */}
                  <div className="aspect-square w-full rounded-lg border overflow-hidden bg-muted/30 relative">
                    {isImageLoading ? (
                      <Skeleton className="aspect-square w-full rounded-lg bg-muted/30 animate-pulse h-full" />
                    ) : imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt="Quote or shayari image generated with Miniature Potato"
                        className="object-contain transition-opacity duration-500"
                        style={{ opacity: isImageLoading ? 0.5 : 1 }}
                        draggable={false}
                        fill
                        sizes="(max-width: 640px) 100vw, 512px"
                        loading="lazy"
                        onLoad={() => setImageLoaded(true)}
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
                        (!imageLoaded || downloaded) &&
                          "bg-muted text-muted-foreground opacity-70 cursor-not-allowed",
                      )}
                      aria-label="Download Generated Image"
                      disabled={!imageLoaded || downloaded}
                    >
                      {downloaded ? (
                        <CheckIcon className="h-4 w-4 text-green-600" />
                      ) : (
                        <DownloadIcon className="h-4 w-4" />
                      )}
                      {downloaded ? "Downloaded!" : "Download Image"}
                    </Button>
                  )}
                </section>

                {/* Song Suggestions */}
                <section
                  className="space-y-4 mt-8"
                  aria-live="polite"
                  aria-busy={isSongLoading}
                >
                  <h2 className="text-xl font-semibold text-foreground">
                    Song Suggestions
                  </h2>
                  {/* Song skeletons */}
                  {isSongLoading && (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, idx) => (
                        <SongSkeletonCard key={idx} />
                      ))}
                    </div>
                  )}
                  {songError &&
                    !isSongLoading &&
                    getSongSuggestionErrorDisplay(songError)}
                  {songResult && songResult.length > 0 && !isSongLoading && (
                    <div className="space-y-4">
                      {songResult.map((song, i) => (
                        <SongCard
                          key={`${song.title}-${song.artist}-${i}`}
                          song={song}
                          isFirst={i === 0}
                        />
                      ))}
                    </div>
                  )}
                  {songResult && songResult.length === 0 && !isSongLoading && (
                    <div className="text-muted-foreground text-center py-8 text-sm">
                      No song suggestions found for your text.
                    </div>
                  )}
                </section>
              </>
            )}
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
