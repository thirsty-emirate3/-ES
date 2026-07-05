import "./globals.css";

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://es-henna-three.vercel.app"),
  title: "まるかめ ESレビューシート | 面接、全部話すと落ちます。",
  description: "ESを貼るだけで、面接用の「30秒回答」と「深掘り想定問答」に変換。面接落ち0の幹枝テクニックをAIで。ES添削も。初回1回無料。",
  openGraph: {
    title: "まるかめ 幹枝シート | 面接、全部話すと落ちます。",
    description: "ESを貼るだけで「30秒回答」と「深掘り想定問答」に変換。面接落ち0の幹枝テクニックをAIで🐢 初回1回無料",
    images: ["/og-interview.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "まるかめ 幹枝シート | 面接、全部話すと落ちます。",
    description: "ESを貼るだけで面接想定問答に変換。初回1回無料🐢",
    images: ["/og-interview.png"],
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
