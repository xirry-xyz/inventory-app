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
    // 2. 如果 Canvas 配置缺失，使用环境变量
    const envConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID
    };

    if (envConfig.projectId && envConfig.projectId !== "YOUR_PROJECT_ID") {
        firebaseConfig = envConfig;
        // Update the exported appId to match the real configuration
        if (envConfig.appId) {
            appId = envConfig.appId;
        }
    } else {
        initializationError = initializationError ||
            'Firebase配置缺失或未更新。请检查 .env 文件配置。';
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
