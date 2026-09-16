import "./globals.css";
import Navbar from "./components/Navbar";

export const metadata = {
  title: "DevConnect - Developer Social & Portfolio Platform",
  description: "Connect with developers worldwide, showcase your GitHub repositories, share insights, and build your professional developer portfolio.",
  keywords: ["developers", "portfolio", "github", "social network", "coding", "software engineer"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-screen flex flex-col bg-slate-950 text-slate-100 antialiased selection:bg-blue-500 selection:text-white">
        <Navbar />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="font-mono gradient-text font-bold text-sm">DevConnect &copy; {new Date().getFullYear()}</span>
            <p className="text-slate-400">Connecting engineers, projects, and ideas across the developer ecosystem.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
