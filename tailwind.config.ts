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
                    'bg-primary': '#F3F4F6', // Light Gray 50
                    'bg-secondary': '#FFFFFF', // White
                    'bg-tertiary': '#F9FAFB', // Light Input bg
                    'bg-elevated': '#FFFFFF', // Elevated White
                    'border': '#E5E7EB', // Gray 200
                    'border-subtle': '#F3F4F6', // Lighter border
                    'accent': '#84cc16', // Lime 500
                    'accent-hover': '#65a30d', // Lime 600
                    'accent-muted': 'rgba(132, 204, 22, 0.15)',
                    'success': '#34D399',
                    'warning': '#FBBF24',
                    'error': '#F87171',
                    'text-primary': '#111827', // Gray 900
                    'text-secondary': '#6B7280', // Gray 500
                    'text-tertiary': '#9CA3AF', // Gray 400
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
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
