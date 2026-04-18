import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#07090F',
        gold: '#C4A050',
        red: '#E24B4A',
        shane: '#378ADD',
        molly: '#7F77DD',
        evey: '#D4537E',
        jax: '#639922',
      },
      fontFamily: {
        sans: ['Helvetica Neue', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
