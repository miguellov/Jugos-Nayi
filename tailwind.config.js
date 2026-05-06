/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1D9E75',
          dark: '#0F6E56',
          soft: '#C8EBDA',
          softer: '#E8F6F0',
          muted: '#7BB8A0',
          foreground: '#ffffff',
        },
        surface: {
          DEFAULT: '#E6F0EA',
          elevated: '#ffffff',
          muted: '#D2E4D9',
          inset: '#F0F8F3',
          border: '#BFD5C8',
        },
      },
      boxShadow: {
        card: '0 1px 3px rgba(15, 110, 86, 0.07)',
        nav: '0 -8px 36px rgba(15, 110, 86, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.65)',
        juice:
          '0 10px 40px -10px rgba(29, 158, 117, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.75)',
        juiceLift: '0 14px 44px -12px rgba(29, 158, 117, 0.22)',
        brandGlow: '0 8px 28px -6px rgba(29, 158, 117, 0.35)',
      },
      backgroundImage: {
        'header-shine':
          'linear-gradient(105deg, rgba(255,255,255,0.97) 0%, rgba(232,246,239,0.85) 45%, rgba(255,247,235,0.9) 100%)',
        'header-shine-dark':
          'linear-gradient(105deg, rgba(15,28,24,0.96) 0%, rgba(17,40,32,0.92) 50%, rgba(22,32,28,0.95) 100%)',
      },
    },
  },
  plugins: [],
}
