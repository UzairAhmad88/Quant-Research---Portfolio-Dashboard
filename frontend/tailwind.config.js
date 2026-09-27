/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B1220',
        'background-secondary': '#111827',
        card: '#151F2E',
        'card-hover': '#1C2A3E',
        border: '#263244',
        'border-subtle': '#1E293B',
        'border-focus': '#3B82F6',
        primary: {
          DEFAULT: '#3B82F6',
          hover: '#2563EB',
          subtle: 'rgba(59, 130, 246, 0.12)',
        },
        positive: {
          DEFAULT: '#22C55E',
          subtle: 'rgba(34, 197, 94, 0.12)',
        },
        negative: {
          DEFAULT: '#EF4444',
          subtle: 'rgba(239, 68, 68, 0.12)',
        },
        warning: {
          DEFAULT: '#F59E0B',
          subtle: 'rgba(245, 158, 11, 0.12)',
        },
        text: {
          primary: '#E5E7EB',
          secondary: '#94A3B8',
          muted: '#64748B',
          disabled: '#475569',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '6px',
        lg: '8px',
        xl: '12px',
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px -1px rgba(0, 0, 0, 0.3)',
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.4)',
        modal: '0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.6)',
      },
    },
  },
  plugins: [],
};
