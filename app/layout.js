import "./globals.css";

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://es-henna-three.vercel.app"),
  title: "まるかめ ESレビューシート | あなたのESに、まるかめの赤ペンを。",
  description: "就活ESをAIまるかめが優しく具体的に添削。良いところを褒めて、気になる点は「なぜ」まで指摘。修正版と面接想定質問つき。初回1回無料。",
  openGraph: {
    title: "まるかめ ESレビューシート",
    description: "あなたのESに、まるかめの赤ペンを。褒めて、直して、面接まで見すえるAI添削。初回1回無料🐢",
    images: ["/og.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "まるかめ ESレビューシート",
    description: "あなたのESに、まるかめの赤ペンを。初回1回無料🐢",
    images: ["/og.png"],
  },
  appleWebApp: { capable: true, title: "まるかめES", statusBarStyle: "default" },
};

export const viewport = { themeColor: "#FFFBEC" };

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@500;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
