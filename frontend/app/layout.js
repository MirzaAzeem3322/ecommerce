import './globals.css';
import Providers from './providers';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { STORE_NAME } from '@/lib/format';

export const metadata = {
  title: { default: STORE_NAME, template: `%s | ${STORE_NAME}` },
  description: 'Quality products, fast delivery and easy returns.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
