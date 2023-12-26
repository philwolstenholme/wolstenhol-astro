const colors = require('tailwindcss/colors');
const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        gray: colors.trueGray,
        medium: {
          DEFAULT: '#228665',
          dark: '#1e785a',
        },
        foursquare: {
          DEFAULT: '#DC3068',
          dark: '#ce225a',
        },
        spotify: {
          DEFAULT: '#1DB954',
          dark: '#1aa64b',
        },
        instagram: {
          DEFAULT: '#E0294C',
          dark: '#b91a39',
        },
        'oc-yellow': {
          0: '#fff9db',
          1: '#fff3bf',
          2: '#ffec99',
          3: '#ffe066',
        },
      },
      boxShadow: {
        hard: '2px 2px 0 rgba(0,0,0,.15)',
      },
      fontFamily: {
        serif: ['"Roboto Slab"', '"Roboto Slab-fallback"', ...defaultTheme.fontFamily.sans],
      },
      maxWidth: {
        container: '71rem',
      },
      typography: theme => ({
        DEFAULT: {
          css: {
            h1: {
              fontFamily: theme('fontFamily.serif').join(', '),
            },
            h2: {
              fontFamily: theme('fontFamily.serif').join(', '),
            },
            h3: {
              fontFamily: theme('fontFamily.serif').join(', '),
            },
            h4: {
              fontFamily: theme('fontFamily.serif').join(', '),
            },
          },
        },
      }),
      cursor: {
        help: 'help',
      },
      fill: {
        blacK: colors.black,
      },
    },
  },
  plugins: [],
  future: {
    hoverOnlyWhenSupported: true,
    disableColorOpacityUtilitiesByDefault: true,
  },
  experimental: {
    optimizeUniversalDefaults: true,
  },
};
