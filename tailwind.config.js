/** @type {import('tailwindcss').Config} */

const colorShade = (name, shade) =>
  `rgb(var(--color-${name}-${shade}) / <alpha-value>)`;

const dynamicColor = (name) => ({
  50:  colorShade(name, 50),
  100: colorShade(name, 100),
  200: colorShade(name, 200),
  300: colorShade(name, 300),
  400: colorShade(name, 400),
  500: colorShade(name, 500),
  600: colorShade(name, 600),
  700: colorShade(name, 700),
  800: colorShade(name, 800),
  900: colorShade(name, 900),
  950: colorShade(name, 950),
  DEFAULT: colorShade(name, 500),
});

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Outfit', 'system-ui', 'sans-serif'],
        body: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: dynamicColor('primary'),
        secondary: dynamicColor('secondary'),
        accent: dynamicColor('accent'),
        aurora: {
          deep: '#f8fafc',
          base: '#f1f5f9',
          surface: '#ffffff',
          elevated: '#f8fafc',
          light: '#e2e8f0',
        },
      },
      borderColor: {
        glass: 'rgba(0, 0, 0, 0.08)',
        'glass-hover': 'rgba(0, 0, 0, 0.14)',
        'glass-strong': 'rgba(0, 0, 0, 0.18)',
      },
      backgroundColor: {
        glass: 'rgba(0, 0, 0, 0.03)',
        'glass-hover': 'rgba(0, 0, 0, 0.05)',
        'glass-active': 'rgba(0, 0, 0, 0.07)',
        'glass-strong': 'rgba(0, 0, 0, 0.08)',
      },
      animation: {
        'fade-up': 'fadeSlideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) both',
        'fade-right': 'fadeSlideRight 0.5s cubic-bezier(0.4, 0, 0.2, 1) both',
        'fade-in': 'fadeIn 0.4s ease both',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) both',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      boxShadow: {
        'glass': '0 1px 3px rgba(0, 0, 0, 0.06), 0 4px 12px rgba(0, 0, 0, 0.04)',
        'glass-lg': '0 4px 12px rgba(0, 0, 0, 0.06), 0 12px 32px rgba(0, 0, 0, 0.06)',
        'glow-primary': '0 2px 12px rgb(var(--color-primary-500) / 0.15), 0 0 40px rgb(var(--color-primary-500) / 0.06)',
        'glow-secondary': '0 2px 12px rgb(var(--color-secondary-500) / 0.15), 0 0 40px rgb(var(--color-secondary-500) / 0.06)',
        'glow-accent': '0 2px 12px rgb(var(--color-accent-500) / 0.15), 0 0 40px rgb(var(--color-accent-500) / 0.06)',
      },
    },
  },
  plugins: [],
}
