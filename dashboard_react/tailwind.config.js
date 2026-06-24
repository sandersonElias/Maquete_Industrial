/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'maquete-dark': '#0D0F14',
        'maquete-surface': '#161B26',
        'maquete-card': '#1C2333',
        'maquete-border': '#252D40',
        'maquete-glow': '#00FFB2',
        'maquete-accent': '#3D9EFF',
        'maquete-warning': '#FFB800',
        'maquete-danger': '#FF4560',
        'maquete-purple': '#A855F7',
      }
    },
  },
  plugins: [],
}
