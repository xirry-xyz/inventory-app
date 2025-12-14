import React from 'react';
import ReactDOM from 'react-dom/client';
// 确保从正确的路径导入主组件
import App from './App.jsx';
// 确保导入全局样式文件
import './index.css';
import { ThemeProvider } from "./components/ThemeProvider";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);