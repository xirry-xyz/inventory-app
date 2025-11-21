// 这是 PostCSS 官方推荐的插件配置数组语法。
// 它可以确保在不同构建环境中（如 Vite 和 Vercel）的兼容性。

module.exports = {
  // 插件必须以数组形式列出
  plugins: [
    require('tailwindcss'),
    require('autoprefixer'),
  ]
}