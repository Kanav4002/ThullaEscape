import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        'thulla-bg': '#F2F3F5',
        'thulla-primary': '#0F172A',
      },
      fontFamily: {
        sans: ['"Space Grotesk"', '"Inter"', 'ui-sans-serif', 'system-ui'],
      },
      boxShadow: {
        'glass': '0 8px 30px rgba(15, 23, 42, 0.12)',
      },
    },
  },
  plugins: [],
};

export default config;

