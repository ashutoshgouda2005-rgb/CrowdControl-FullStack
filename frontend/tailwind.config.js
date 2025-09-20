/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0ea5e9',
        accent: '#22c55e',
        danger: '#ef4444'
      },
      fontFamily: {
        'inter': ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', 'monospace']
      }
    },
  },
  plugins: [],
}
