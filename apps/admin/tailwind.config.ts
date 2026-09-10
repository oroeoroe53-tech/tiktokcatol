import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./pages/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './features/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#14132B',
        primary: '#4338CA',
        primaryDark: '#2E2570',
        accent: '#F5A623',
        bg: '#FAF9FF',
        surface: '#FFFFFF',
        border: '#E6E3F5',
        textSecondary: '#6B6790',
        success: '#4CAF7D',
        danger: '#E5484D',
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
