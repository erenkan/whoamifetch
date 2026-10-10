// Tailwind v4 through PostCSS: the build and dev server use webpack, which has no Tailwind loader of its own.
const config = {
  plugins: { "@tailwindcss/postcss": {} },
};

export default config;
