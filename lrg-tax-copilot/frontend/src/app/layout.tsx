import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LRG Tax Copilot',
  description: 'Internal AI assistant for LRG Tax Services',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
