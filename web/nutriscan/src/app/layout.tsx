import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const metadata = {
  title: "NutriScan",
  description: "L'application de nutrition la plus intelligente",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${plusJakartaSans.className} antialiased bg-background text-foreground`}>
        {children}
      </body>
    </html>
  );
}
