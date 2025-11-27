import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

let firebaseApp;
let db;
let auth;
let initializationError = null;
let firebaseConfig = null;
let initialAuthToken = null;
let appId = 'default-app-id';

// 1. 获取 Canvas 环境的特殊变量
const configString = typeof __firebase_config !== 'undefined' ? __firebase_config : null;
// 在 Vercel 环境中，这个变量将是 undefined
initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
appId = typeof __app_id !== 'undefined' ? __app_id : appId;

if (configString && configString.trim() !== '' && configString.trim() !== '{}') {
    // 优先使用 Canvas 提供的配置 (Vercel 上会跳过)
    try {
        firebaseConfig = JSON.parse(configString);
    } catch (e) {
        initializationError = `解析特殊配置(__firebase_config)失败: ${e.message}。请检查 JSON 格式。`;
    }
} else {
    // 2. 如果 Canvas 配置缺失，使用硬编码/环境变量
    const hardcodedConfig = {
      apiKey: "AIzaSyCbQZ-qkJuPr3lmufKbVgK1U_Rmyfy4u0E",
      authDomain: "home-inventory-manager-5ec7a.firebaseapp.com",
      projectId: "home-inventory-manager-5ec7a",
      storageBucket: "home-inventory-manager-5ec7a.firebasestorage.com",
      messagingSenderId: "712500151586",
      appId: "1:712500151586:web:b44aa3d513b97a174d917b"
    };

    if (hardcodedConfig.projectId && hardcodedConfig.projectId !== "YOUR_PROJECT_ID") {
        firebaseConfig = hardcodedConfig;
    } else {
        initializationError = initializationError || 
                              'Firebase配置缺失或未更新。请在Firebase控制台获取配置，并替换代码中的占位符。';
    }
}

// 3. 尝试初始化 Firebase App
if (firebaseConfig && !initializationError) {
    try {
        firebaseApp = initializeApp(firebaseConfig);
        db = getFirestore(firebaseApp);
        auth = getAuth(firebaseApp);
    } catch (e) {
        console.error("Firebase Initialization Error:", e);
        initializationError = `Firebase初始化实例失败: ${e.message}。请检查密钥是否正确。`;
    }
}

const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider, initializationError, initialAuthToken, appId };
