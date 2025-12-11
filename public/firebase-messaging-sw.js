
// Scripts for firebase messaging
importScripts('https://www.gstatic.com/firebasejs/10.12.3/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.3/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
firebase.initializeApp({
    apiKey: "YOUR_API_KEY_WILL_BE_INJECTED_BY_ENV_OR_HARDCODED_IF_NEEDED",
    // Wait, Service Worker doesn't have access to Vite env vars directly at runtime in generated file unless we do build magic.
    // Standard practice: Initialize with full config.
    // Since we are making this public/firebase-messaging-sw.js, we might need to hardcode the config OR fetch it from strict endpoint.
    // But wait, user's config is in .env. 
    // Let's use a placeholder first, or better, just standard messaging.
    // Actually, for compat SDK, we often just need to init.
    // Let's try to just use default logic or simple init.
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    // Customize notification here
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/pwa-192x192.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
