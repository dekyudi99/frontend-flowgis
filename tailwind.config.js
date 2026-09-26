/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", 
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0ea5e9',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#22d3ee',
          foreground: '#030712',
        },
        accent: {
          DEFAULT: '#2dd4bf',
        },
        card: {
          DEFAULT: 'hsl(0 0% 100%)',
          foreground: 'hsl(222.2 84% 4.9%)'
        },
        background: 'hsl(0 0% 100%)',
        foreground: 'hsl(222.2 84% 4.9%)',
        'muted-foreground': 'hsl(215.4 16.3% 46.9%)',
      },
    },
  },
  plugins: [],
}

