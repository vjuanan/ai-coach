import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'CV-OS | CrossFit Programming',
    description: 'Professional CrossFit programming and mesocycle design platform for coaches',
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
