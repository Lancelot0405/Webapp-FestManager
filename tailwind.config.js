/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Warm Feast — F&B / Festival palette ──────────────────────────
        brand: {
          50:  '#FFF7ED',   // orange-50
          100: '#FFEDD5',   // orange-100
          200: '#FED7AA',   // orange-200 — border nhạt
          300: '#FDBA74',   // orange-300
          400: '#FB923C',   // orange-400 — dark primary
          500: '#F97316',   // orange-500 — light primary ★
          600: '#EA6D0D',   // primary hover
          700: '#C2570A',   // pressed
          800: '#9A3E08',   // dark heavy
          900: '#431407',   // dark light bg
        },
        saffron: {
          50:  '#FEFCE8',
          100: '#FEF9C3',
          300: '#FDE047',
          400: '#FACC15',
          500: '#EAB308',   // yellow-500 — secondary accent ★
          600: '#CA8A04',
        },
        herb: {
          400: '#4ADE80',
          500: '#22C55E',   // green-500 — success / fresh ★
          600: '#16A34A',
        },
        espresso: {
          50:  '#FEF3C7',   // dark text-primary
          100: '#FCD34D',   // dark text-secondary
          700: '#2C1A0E',   // dark card bg
          800: '#1C1008',   // dark surface / light text-primary
          900: '#0F0804',   // darkest
        },
        surface: {
          light: '#FFFBF5',
          dark:  '#1C1008',
        },
        card: {
          light: '#FFFFFF',
          dark:  '#2C1A0E',
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
        // Warm shadows — tinted orange/amber instead of neutral gray
        card:  '0 1px 4px 0 rgb(249 115 22 / 0.08), 0 1px 2px -1px rgb(249 115 22 / 0.06)',
        warm:  '0 4px 16px 0 rgb(249 115 22 / 0.15), 0 1px 4px 0 rgb(249 115 22 / 0.08)',
        hero:  '0 8px 32px 0 rgb(234 99 13 / 0.25)',
        float: '0 8px 24px 0 rgb(249 115 22 / 0.20)',
      },

      backgroundImage: {
        // Gradient chính — cam đỏ → vàng nghệ
        'brand-gradient':   'linear-gradient(135deg, #F97316 0%, #EAB308 100%)',
        // Gradient tối hơn cho header
        'brand-gradient-d': 'linear-gradient(135deg, #EA6D0D 0%, #CA8A04 100%)',
        // Hero card
        'hero-gradient':    'linear-gradient(135deg, #F97316 0%, #FACC15 50%, #22C55E 100%)',
        // Dark mode surface gradient
        'dark-surface':     'linear-gradient(180deg, #1C1008 0%, #2C1A0E 100%)',
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
  plugins: [],
}
