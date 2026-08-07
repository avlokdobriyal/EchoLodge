import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { ThemeProvider } from "../components/ThemeContext";
import { ToastProvider } from "../components/ui/Toast";
import SessionProvider from "../components/SessionProvider";
import ErrorBoundary from "../components/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "EchoLodge - Cozy Stays",
  description:
    "A small riverside lodge in Laxman Jhula, Rishikesh. Twelve rooms across three categories, bookable directly with us — no booking-site commission in the middle.",
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f5f0" },
    { media: "(prefers-color-scheme: dark)", color: "#12161c" },
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex flex-col min-h-screen bg-canvas text-ink transition-colors duration-300">
        <SessionProvider>
          <ThemeProvider>
            <ToastProvider>
              <Navbar />
              {/* The navbar is fixed so the homepage photograph can run under
                  it edge to edge; this reserves the height it no longer takes
                  up in flow. Hero cancels it with a matching -mt-16. */}
              <main className="flex-grow pt-16">
                <ErrorBoundary>{children}</ErrorBoundary>
              </main>
              <Footer />
            </ToastProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
