/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        // Primary Beauty Brand Colors - Inspired by Fresha but enhanced
        beauty: {
          50: '#faf8ff',
          100: '#f3f0ff',
          200: '#e9e2ff',
          300: '#d8c8ff',
          400: '#c5a5ff',
          500: '#b084ff',
          600: '#9b59ff',
          700: '#8b3fff',
          800: '#7c2cff',
          900: '#6821d9',
          950: '#4a0ea0',
        },
        // Secondary Warm Colors
        rose: {
          50: '#fff1f3',
          100: '#ffe4e8',
          200: '#ffced6',
          300: '#ffa8b8',
          400: '#ff7195',
          500: '#ff4d75',
          600: '#ff1f5a',
          700: '#e0134a',
          800: '#c1154a',
          900: '#a51647',
        },
        // Neutral Grays
        gray: {
          50: '#fafbfc',
          100: '#f4f6f8',
          200: '#e6eaed',
          300: '#d0d7de',
          400: '#9da4ab',
          500: '#6c737a',
          600: '#58606a',
          700: '#495058',
          800: '#3d434b',
          900: '#2f3439',
          950: '#1c2025',
        },
        // Success, Warning, Error
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
        },
        error: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        },
      },
      backgroundImage: {
        'gradient-beauty': 'linear-gradient(135deg, #b084ff 0%, #ff4d75 100%)',
        'gradient-beauty-subtle': 'linear-gradient(135deg, #faf8ff 0%, #fff1f3 100%)',
        'gradient-beauty-reverse': 'linear-gradient(135deg, #ff4d75 0%, #b084ff 100%)',
        'gradient-dark': 'linear-gradient(135deg, #2f3439 0%, #1c2025 100%)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Cal Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', '0.75rem'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '112': '28rem',
        '128': '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'beauty': '0 10px 40px -10px rgba(176, 132, 255, 0.3)',
        'beauty-lg': '0 20px 60px -10px rgba(176, 132, 255, 0.4)',
        'rose': '0 10px 40px -10px rgba(255, 77, 117, 0.3)',
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 8px 30px -4px rgba(0, 0, 0, 0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-15px)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}