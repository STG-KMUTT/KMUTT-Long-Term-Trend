/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Sarabun', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Prompt', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        kmutt: {
          50: '#fff7e6',
          100: '#ffebbf',
          200: '#ffd680',
          300: '#ffbf4d',
          400: '#ffa726',
          500: '#f29400',
          600: '#d97f00',
          700: '#b86700',
          800: '#8a4d00',
          900: '#5c3000',
        },
      },
    },
  },
  plugins: [],
}
