import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Sorteio da Pelada",
  description:
    "Monte times equilibrados para a sua pelada com sorteio inteligente por posição e nível."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme');if(t==='light')document.documentElement.classList.remove('dark');else document.documentElement.classList.add('dark');})();`
          }}
        />
      </head>
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased transition-colors dark:bg-slate-950 dark:text-slate-50">
        <Sidebar />
        <div className="lg:pl-24 xl:pl-28 2xl:pl-32">
          <Nav />
          {children}
        </div>
      </body>
    </html>
  );
}

