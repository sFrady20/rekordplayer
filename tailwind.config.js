/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#121212',
        surface: '#181818',
        elevated: '#242424',
        border: '#2a2a2a',
        primary: {
          DEFAULT: '#1DB954',
          foreground: '#000000',
        },
        foreground: '#ffffff',
        muted: '#b3b3b3',
        subtle: '#6a6a6a',
        destructive: '#e5484d',
      },
    },
  },
  plugins: [],
};
