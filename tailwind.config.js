/** @type {import('tailwindcss').Config} */
export default {
  // 告诉 Tailwind 在哪些文件中查找和解析样式类
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}