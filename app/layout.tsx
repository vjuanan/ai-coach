import type { Metadata } from 'next';
import './globals.css';

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
        <html lang="es" className="dark">
            <body className="min-h-screen bg-cv-bg-primary antialiased">
                {children}
            </body>
        </html>
    );
}
