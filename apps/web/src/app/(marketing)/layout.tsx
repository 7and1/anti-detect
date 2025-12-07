import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-bg-primary">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
