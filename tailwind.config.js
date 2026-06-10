/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── shadcn/ui semantic tokens ──────────────────────────────────────
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: 'var(--shadcn-primary)',
          foreground: 'var(--shadcn-primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--shadcn-secondary)',
          foreground: 'var(--shadcn-secondary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
        },
        border: 'var(--border-color)',
        input: 'var(--input-color)',
        ring: 'var(--ring)',
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        // ── MeetCraft — Purple/Indigo palette ─────────────────────────────
        brand: {
          50:  '#F5F3FF',   // violet-50
          100: '#EDE9FE',   // violet-100
          200: '#DDD6FE',   // violet-200 — border nhạt
          300: '#C4B5FD',   // violet-300
          400: '#A78BFA',   // violet-400
          500: '#8B5CF6',   // violet-500 — primary ★
          600: '#7C3AED',   // violet-600 — primary hover
          700: '#6D28D9',   // violet-700 — pressed
          800: '#5B21B6',   // violet-800
          900: '#4C1D95',   // violet-900
        },
        indigo: {
          50:  '#EEF2FF',
          100: '#E0E7FF',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',   // indigo-500 — secondary accent ★
          600: '#4F46E5',
        },
        herb: {
          400: '#4ADE80',
          500: '#22C55E',   // green-500 — success ★
          600: '#16A34A',
        },
        slate: {
          50:  '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        // Giữ tên espresso để không break các class cũ, map sang slate
        espresso: {
          50:  '#F8FAFC',
          100: '#F1F5F9',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        surface: {
          light: '#F8F9FA',
          dark:  '#F8F9FA',
        },
        card: {
          light: '#FFFFFF',
          dark:  '#FFFFFF',
        },
      },

      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },

      borderRadius: {
        card:  '1rem',     // 16px
        input: '0.75rem',  // 12px
        pill:  '9999px',
      },

      spacing: {
        'safe-b': 'env(safe-area-inset-bottom, 0px)',
        'nav':    '4rem',  // 64px BottomNav height
      },

      boxShadow: {
        // Purple-tinted shadows
        card:  '0 1px 4px 0 rgb(124 58 237 / 0.08), 0 1px 2px -1px rgb(124 58 237 / 0.06)',
        warm:  '0 4px 16px 0 rgb(124 58 237 / 0.15), 0 1px 4px 0 rgb(124 58 237 / 0.08)',
        hero:  '0 8px 32px 0 rgb(124 58 237 / 0.25)',
        float: '0 8px 24px 0 rgb(124 58 237 / 0.20)',
      },

      backgroundImage: {
        // Gradient tím → indigo
        'brand-gradient':   'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
        'brand-gradient-d': 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
        'hero-gradient':    'linear-gradient(135deg, #8B5CF6 0%, #6366F1 50%, #22C55E 100%)',
        'dark-surface':     'linear-gradient(180deg, #F8F9FA 0%, #F1F5F9 100%)',
      },

      animation: {
        'fade-in':    'fadeIn 0.2s ease-out',
        'fade-up':    'fadeUp 0.22s ease-out',
        'slide-up':   'slideUp 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
        'slide-left': 'slideLeft 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
        'pop':        'pop 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'shimmer':    'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0', transform: 'translateY(-6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeUp:    { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(100%)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideLeft: { from: { opacity: '0', transform: 'translateX(-100%)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        pop:       { from: { transform: 'scale(0.92)' }, to: { transform: 'scale(1)' } },
        shimmer:   { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
