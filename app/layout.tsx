import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono', display: 'swap' });

export const metadata: Metadata = {
    title: 'AI Coach',
    description: 'Professional CrossFit programming and mesocycle design platform',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="es" className={`${inter.variable} ${jetbrainsMono.variable}`}>
            <body className="min-h-screen bg-cv-bg-primary antialiased">
                {children}
                <Toaster position="top-center" richColors />
            </body>
        </html>
    );
}
