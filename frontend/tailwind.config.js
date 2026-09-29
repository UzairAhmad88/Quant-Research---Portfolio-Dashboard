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
        background: '#F8FAF9',
        'background-secondary': '#FFFFFF',
        card: '#FFFFFF',
        'card-hover': '#F0FDF4',
        border: '#E5E7EB',
        'border-subtle': '#F1F5F9',
        'border-strong': '#CBD5E1',
        'border-focus': '#14532D',
        forest: {
          DEFAULT: '#14532D',
          deep: '#0B3D2E',
          medium: '#166534',
          light: '#DCFCE7',
          soft: '#F0FDF4',
        },
        primary: {
          DEFAULT: '#14532D',
          hover: '#166534',
          deep: '#0B3D2E',
          light: '#DCFCE7',
          soft: '#F0FDF4',
          subtle: '#DCFCE7',
        },
        positive: {
          DEFAULT: '#15803D',
          candle: '#16A34A',
          subtle: '#DCFCE7',
        },
        negative: {
          DEFAULT: '#DC2626',
          subtle: '#FEE2E2',
        },
        warning: {
          DEFAULT: '#D97706',
          subtle: '#FEF3C7',
        },
        info: {
          DEFAULT: '#2563EB',
          subtle: '#DBEAFE',
        },
        text: {
          primary: '#17211B',
          secondary: '#334155',
          muted: '#64748B',
          disabled: '#94A3B8',
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
        card: '10px',
        xl: '12px',
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        card: '0 2px 8px rgba(0, 0, 0, 0.04)',
        modal: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
};

