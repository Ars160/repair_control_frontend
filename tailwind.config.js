/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bauberg: {
          blue: '#0036CF',       // Primary Deep Blue
          sky: '#4EA0EB',        // Secondary Sky Blue
          ocean: '#0B55AC',      // Darker Blue
          bright: '#006AE7',     // Bright Blue
          navy: '#000080',       // Navy
          surface: '#F8FAFC',    // Light Background
        }
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
