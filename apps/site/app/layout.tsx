export const metadata = {
  title: 'AI API Broker',
  description: 'Usage-metered multi-provider AI API',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
