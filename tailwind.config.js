module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Crimson Pro', 'Garamond', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        law: {
          primary: '#1a365d',
          secondary: '#2c5282',
          accent: '#90cdf4',
          paper: '#f7fafc',
          ink: '#2d3748',
        },
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#2d3748',
            h1: {
              fontFamily: 'Crimson Pro, Garamond, serif',
              color: '#1a365d',
            },
            h2: {
              fontFamily: 'Crimson Pro, Garamond, serif',
              color: '#2c5282',
            },
            h3: {
              fontFamily: 'Crimson Pro, Garamond, serif',
              color: '#2c5282',
            },
            a: {
              color: '#2c5282',
              '&:hover': {
                color: '#90cdf4',
              },
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
} 