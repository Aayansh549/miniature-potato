import type React from "react"
import "./globals.css"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Words & True Hearts - Shayari Image Generator</title>
        <meta name="description" content="Create beautiful Shayari images with custom backgrounds" />
      </head>
      <body>
          {children}
      </body>
    </html>
  )
}
