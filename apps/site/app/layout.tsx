import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import { BetaBanner } from '@/components/beta-banner';

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <BetaBanner />
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
