import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    colors: {
      // Hard contrast layer
      black: '#000000',
      ink: '#111111',
      ash: '#252525',
      smoke: '#E2E2E2',
      cloud: '#F7F7F7',
      white: '#FFFFFF',

      // Soft contrast layer
      dusk: '#909090',
      fog: '#BBBBBB',
      veil: '#F6F6F6',
      ghost: '#FEFEFE',
      tint: '#EEF0FA',

      // Accent trio
      prism: '#5570C5',
      haze: '#BEC9EA',
      depth: '#2E4296',

      // Brand
      brand: '#7B90D2',
    },
  },
  plugins: [],
};

export default config;
