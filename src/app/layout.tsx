import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";

export const metadata: Metadata = {
  title: "BP Cleaning",
  description: "Gestione magazzino prodotti pulizia",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: "/icon-192.png",
  },
  openGraph: {
    title: "BP Cleaning",
    description: "Gestione magazzino prodotti pulizia",
    url: "https://magazzino.bpcleaning.it",
    siteName: "BP Cleaning",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "BP Cleaning",
      },
    ],
    locale: "it_IT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BP Cleaning",
    description: "Gestione magazzino prodotti pulizia",
    images: ["/og-image.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BP Cleaning",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1d4ed8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-192.png" />
      </head>
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
