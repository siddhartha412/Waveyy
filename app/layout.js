import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "sonner";
import MobileMenu from "@/components/mobile-menu";
import MusicProvider from "@/components/providers/music-provider";
import NextProvider from "@/components/providers/next-provider";
import AuthProvider from "@/components/providers/auth-provider";
import RoomProvider from "@/components/providers/room-provider";
import ServiceWorkerReset from "@/components/dev/sw-reset";

const bricolage_grotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

export const metadata = {
  title: "Waveyy",
  description: "Sound like real waves.",
  icons: "/favi-icon.jpg",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://c.saavncdn.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://c.saavncdn.com" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={bricolage_grotesque.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ServiceWorkerReset />
          <NextTopLoader
            color="hsl(var(--primary))"
            initialPosition={0.08}
            crawlSpeed={200}
            height={3}
            crawl={true}
            showSpinner={false}
            easing="ease"
            speed={200}
            shadow="0 0 10px hsl(var(--primary)),0 0 15px hsl(var(--primary))"
            template='<div class="bar" role="bar"><div class="peg"></div></div>
        <div class="spinner" role="spinner"><div class="spinner-icon"></div></div>'
            zIndex={1600}
            showAtBottom={false}
          />
          <AuthProvider>
            <NextProvider>
              <MusicProvider>
                <RoomProvider>{children}</RoomProvider>
              </MusicProvider>
            </NextProvider>
          </AuthProvider>
          {/* <MobileMenu/> */}
          <Toaster position="top-center" visibleToasts={1} />
        </ThemeProvider>
      </body>
    </html>
  );
}
