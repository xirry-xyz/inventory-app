/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '375px',
        // Default breakpoints: sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px
      },
      borderRadius: {
        'xl': '1rem',   // 默认 xl 圆角稍微加大
        '2xl': '1.5rem', // 大圆角
        '3xl': '2rem',   // 适用于卡片、按钮等的大圆角
        '4xl': '2.5rem', // 适用于更大的容器或突出元素
      },
      colors: {
        // 定义应用主要色板
        primary: {
          light: '#6366F1', // Indigo Light
          DEFAULT: '#4F46E5', // Indigo Default
          dark: '#4338CA',  // Indigo Dark
        },
        secondary: {
          light: '#EC4899', // Pink Light
          DEFAULT: '#DB2777', // Pink Default
          dark: '#BE185D',  // Pink Dark
        },
        accent: {
          green: '#34D399', // 亮绿色
          yellow: '#FBBF24', // 亮黄色
          red: '#EF4444',   // 亮红色
          blue: '#60A5FA',   // 亮蓝色
        },
        // 调整灰度，使其更柔和
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
      },
      fontFamily: {
        // 根据需要添加字体，例如 'Poppins', 'Inter' 等
        // 'sans': ['Inter', 'sans-serif'], 
      },
      // 可以添加渐变色预设
      backgroundImage: {
        'gradient-primary': 'linear-gradient(to right, #6366F1, #4F46E5)',
        'gradient-secondary': 'linear-gradient(to right, #EC4899, #DB2777)',
        'gradient-green-light': 'linear-gradient(to bottom right, #D1FAE5, #A7F3D0)', // 浅绿色渐变
        'gradient-yellow-light': 'linear-gradient(to bottom right, #FDE68A, #FCD34D)', // 浅黄色渐变
        'gradient-red-light': 'linear-gradient(to bottom right, #FECACA, #FCA5A5)',   // 浅红色渐变
        'gradient-blue-light': 'linear-gradient(to bottom right, #BFDBFE, #93C5FD)',   // 浅蓝色渐变
      }
    },
  },
  plugins: [],
}