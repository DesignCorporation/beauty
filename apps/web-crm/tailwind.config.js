/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Flat Design Pastel Colors
        pastel: {
          lavender: '#E8E1FF',
          pink: '#FFE1E8', 
          mint: '#E1FFF2',
          peach: '#FFE8E1',
          blue: '#E1F3FF',
          yellow: '#FFF9E1',
        },
        primary: {
          50: '#f3f1ff',
          100: '#ede6ff',
          200: '#ddd2ff',
          300: '#c4b1ff',
          400: '#a685ff',
          500: '#8b5aff',
          600: '#6B46C1', // Main purple
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        // Clean grays for flat design
        neutral: {
          50: '#FAFAFA',   // Main background
          100: '#F8FAFC',  // Hover states
          200: '#F1F5F9',  // Active states  
          300: '#E2E8F0',  // Borders
          400: '#94A3B8',  // Secondary text
          500: '#64748B',  // Muted text
          600: '#475569',
          700: '#334155', 
          800: '#2D3748',  // Primary text
          900: '#1F2937',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      // Remove default max-width constraints
      maxWidth: {
        'none': 'none',
        'full': '100%',
        // Keep some useful ones but remove 7xl default usage
        'screen-2xl': '1536px',
      },
      // Flat design friendly spacing
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      // Clean border radius for flat design
      borderRadius: {
        'flat': '6px',
        'flat-lg': '8px',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
