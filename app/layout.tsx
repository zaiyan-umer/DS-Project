import "./globals.css";
import GraphWrapper from "./components/GraphWrapper/page";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-white">
        {children}
        <GraphWrapper />
      </body>
    </html>
  );
}
