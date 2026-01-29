import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'AI Coach',
    description: 'Professional CrossFit programming and mesocycle design platform',
    icons: {
        icons: {
            icon: '/app-icon.png',
            shortcut: '/app-icon.png',
            apple: '/app-icon.png',
        },
    };

    export default function RootLayout({
        children,
    }: {
        children: React.ReactNode;
    }) {
        return (
            <html lang="es">
                <body className="min-h-screen bg-cv-bg-primary antialiased">
                    {children}
                </body>
            </html>
        );
}
