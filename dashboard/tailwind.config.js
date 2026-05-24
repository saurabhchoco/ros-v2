/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./vendor-index.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6D4AFF', // ROS Purple
          600: '#5b3ad4',
          700: '#4a2eb8',
          800: '#3a2296',
          900: '#2e1b78',
        },
        accent: {
          500: '#8B5CF6',
          600: '#A855F7',
        },
        success: { 500: '#22C55E' },
        warning: { 500: '#F59E0B' },
        danger: { 500: '#EF4444' },
        neutral: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 8px 24px rgba(0, 0, 0, 0.06)',
        hover: '0 12px 28px rgba(0, 0, 0, 0.08)',
      },
      borderRadius: {
        xl: '18px', // 18px radius
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'progress': 'progress 0.8s ease-out',
        'stagger-fade': 'fadeIn 0.3s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'scale(0.95)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        progress: {
          '0%': { width: '0%' },
          '100%': { width: 'var(--width)' },
        },
      },
    },
  },
  plugins: [],
};