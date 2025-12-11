
// Scripts for firebase messaging
importScripts('https://www.gstatic.com/firebasejs/10.12.3/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.3/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
firebase.initializeApp({
    apiKey: "AIzaSyCbQZ-qkJuPr3lmufKbVgK1U_Rmyfy4u0E",
    authDomain: "home-inventory-manager-5ec7a.firebaseapp.com",
    projectId: "home-inventory-manager-5ec7a",
    storageBucket: "home-inventory-manager-5ec7a.firebasestorage.com",
    messagingSenderId: "712500151586",
    appId: "1:712500151586:web:b44aa3d513b97a174d917b"
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
