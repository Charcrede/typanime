import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/Components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      fontFamily: {
        ProductSans : 'ProductSans',
        Metropolis : 'Metropolis',
        Bebas : 'Bebas',
        Space : 'SpaceGrotesk',
        NewRock : 'new_rock'
      },
      colors : {
        // primary : '#0b232d',
        primary : '#1f3f71',
        secondary : '#a8aae7',
        tertiary : '#377dbf'
      },
      screens : {
        xs : '50px',
        lg: '1024px'
      },
      animation : {
        'fade-in' : 'fadeIn 1s  infinite',
        'fade-out' : 'fadeOut 1s ease-in-out forwards',
      },
      keyframes : {
        fadeIn : {  
          '0%' : { opacity : '0' },
          '100%' : { opacity : '1' }
        },  
        fadeOut : {
          '0%' : { opacity : '1' },
          '100%' : { opacity : '0' }
        }
      }
    },
  },
  plugins: [],
};
export default config;
