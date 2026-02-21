import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // CV-OS Dark Theme
                'cv': {
                    'bg-primary': '#F8FAFC', // Slate 50 (Cooler/Cleaner than Gray)
                    'bg-secondary': '#FFFFFF', // White
                    'bg-tertiary': '#F1F5F9', // Slate 100
                    'bg-elevated': '#FFFFFF',
                    'border': '#E2E8F0', // Slate 200
                    'border-subtle': '#F8FAFC',
                    'accent': '#86C4A3', // Soft Sage / Pastel Mint
                    'accent-hover': '#6EE7B7', // Emerald 300
                    'accent-muted': 'rgba(134, 196, 163, 0.15)',
                    'success': '#34D399',
                    'warning': '#FBBF24',
                    'error': '#F87171',
                    'text-primary': '#0F172A', // Slate 900
                    'text-secondary': '#475569', // Slate 600
                    'text-tertiary': '#94A3B8', // Slate 400
                },
                // Antopanti Redesign Theme
                'anto': {
                    'burgundy': '#5B0F2A', // Headers and dark sections
                    'burgundy-muted': '#8B1A47', // Lighter burgundy for secondary dark headers
                    'gold': '#EAB308', // Gold/Yellow accents and dividers
                    'gold-light': '#FEF08A', // Muted gold
                    'magenta': '#D81B60', // Big numbers and bold highlights
                    'pink': '#F472B6', // Standard pink
                    'pink-light': '#FDF2F5', // Background for rep/set tables
                    'pink-border': '#FCE7F3', // Soft borders
                    'bg': '#F3F4F6', // Outer gray background
                    'text-main': '#0F172A', // Main dark text
                    'text-muted': '#475569', // Muted dark gray text
                },
            },
            fontFamily: {
                sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
                mono: ['var(--font-jetbrains-mono)', 'monospace'],
            },
            fontSize: {
                '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
            },
            boxShadow: {
                'cv-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.5)',
                'cv-md': '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
                'cv-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
                'cv-glow': '0 0 20px rgba(255, 107, 53, 0.3)',
            },
            animation: {
                'fade-in': 'fadeIn 0.2s ease-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'slide-down': 'slideDown 0.2s ease-out',
                'scale-in': 'scaleIn 0.15s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideDown: {
                    '0%': { opacity: '0', transform: 'translateY(-10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                scaleIn: {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
            },
        },
    },
    plugins: [],
};

export default config;
