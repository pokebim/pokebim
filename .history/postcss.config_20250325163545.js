module.exports = {
  plugins: {
    'postcss-import': {},
-   'tailwindcss': {},
+   '@tailwindcss/postcss': {}, // 👈 Updated package name
    'autoprefixer': {},
  },
}