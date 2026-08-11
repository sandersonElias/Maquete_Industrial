/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'bg': '#0F1117',
        'surface': '#1A1D27',
        'card': '#1A1D27',
        'border': '#2A2D3A',
        'text': '#E4E7EC',
        'muted': '#8B8FA3',
        'accent': '#3B82F6',
        'success': '#22C55E',
        'warning': '#F59E0B',
        'danger': '#EF4444',
      }
    },
  },
  plugins: [],
}
