import type { Metadata, Viewport } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "OrientaProf",
  description: "Orientación con Profesionales",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full flex flex-col bg-gradient-to-br from-[#e9f8ef] via-[#bfe9cf] to-[#f8fbf5]">
        {children}
      </body>
    </html>
  )
}
