/**
 * PostCSS Configuration (ES Module format)
 * 因为 package.json 设置了 "type": "module"，所以这里需要使用 export default 语法。
 */
export default {
  plugins: {
    // Tailwind CSS 必须是第一个插件
    tailwindcss: {},
    
    // Autoprefixer 负责添加必要的浏览器前缀
    autoprefixer: {},
  },
};