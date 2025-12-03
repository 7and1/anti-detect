import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Background layers
        bg: {
          primary: '#09090b',
          secondary: '#18181b',
          tertiary: '#27272a',
          hover: '#3f3f46',
        },
        // Text hierarchy
        text: {
          primary: '#fafafa',
          secondary: '#a1a1aa',
          muted: '#71717a',
          disabled: '#52525b',
        },
        // Status colors
        success: {
          DEFAULT: '#10b981',
          dim: '#065f46',
        },
        warning: {
          DEFAULT: '#f59e0b',
          dim: '#78350f',
        },
        error: {
          DEFAULT: '#ef4444',
          dim: '#7f1d1d',
        },
        info: {
          DEFAULT: '#3b82f6',
        },
        // Accent colors
        accent: {
          DEFAULT: '#8b5cf6',
        },
        terminal: {
          DEFAULT: '#22d3ee',
        },
        neon: {
          DEFAULT: '#22c55e',
        },
        // Borders
        border: {
          DEFAULT: '#27272a',
          subtle: '#3f3f46',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      fontSize: {
        xs: ['clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)', { lineHeight: '1.5' }],
        sm: ['clamp(0.875rem, 0.8rem + 0.375vw, 1rem)', { lineHeight: '1.5' }],
        base: ['clamp(1rem, 0.9rem + 0.5vw, 1.125rem)', { lineHeight: '1.5' }],
        lg: ['clamp(1.125rem, 1rem + 0.625vw, 1.25rem)', { lineHeight: '1.4' }],
        xl: ['clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)', { lineHeight: '1.4' }],
        '2xl': ['clamp(1.5rem, 1.3rem + 1vw, 2rem)', { lineHeight: '1.3' }],
        '3xl': ['clamp(2rem, 1.7rem + 1.5vw, 2.5rem)', { lineHeight: '1.2' }],
        '4xl': ['clamp(2.5rem, 2rem + 2.5vw, 3.5rem)', { lineHeight: '1.1' }],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-out': 'fadeOut 0.3s ease-in',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-out': 'slideOut 0.3s ease-in',
        'scale-in': 'scaleIn 0.2s ease-out',
        'spin-slow': 'spin 3s linear infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'count-up': 'countUp 1.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideIn: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideOut: {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(10px)', opacity: '0' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(34, 197, 94, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(34, 197, 94, 0.5)' },
        },
      },
      backgroundImage: {
        'gradient-score': 'linear-gradient(135deg, #ef4444 0%, #f59e0b 50%, #10b981 100%)',
        'gradient-glow': 'linear-gradient(180deg, rgba(34, 197, 94, 0.2) 0%, transparent 100%)',
        'grid-pattern': `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(39 39 42 / 0.5)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e")`,
      },
    },
  },
  plugins: [],
};

export default config;
