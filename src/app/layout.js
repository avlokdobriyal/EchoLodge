import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { ThemeProvider } from "../components/ThemeContext";
import { ToastProvider } from "../components/ui/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "EchoLodge",
  description: "Zero-commission booking engine for eco-friendly homestays",
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf5ec" },
    { media: "(prefers-color-scheme: dark)", color: "#171310" },
  ],
};

// Runs synchronously in <head> before paint so the correct theme is applied
// with no flash. Respects a stored choice, otherwise the system preference.
const themeScript = `(function(){try{var t=localStorage.getItem("theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dark");}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex flex-col min-h-screen transition-colors duration-300 bg-cream dark:bg-bark text-ink dark:text-parchment">
        <ThemeProvider>
          <ToastProvider>
            <Navbar />
            <main className="flex-grow">{children}</main>
            <Footer />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
