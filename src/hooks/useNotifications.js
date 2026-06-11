import { useState, useEffect } from 'react';
import { getMessagingInstance } from '../config/firebase.config';
import { getToken, onMessage } from 'firebase/messaging';

export function useNotifications() {
  const [permission, setPermission] = useState(Notification?.permission || 'default');
  const [token, setToken] = useState(null);

  const requestPermission = async () => {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        const messaging = await getMessagingInstance();
        if (messaging) {
          const fcmToken = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
          });
          setToken(fcmToken);
        }
      }
    } catch (error) {
      console.error('Notification permission error:', error);
    }
  };

  useEffect(() => {
    const setupMessaging = async () => {
      const messaging = await getMessagingInstance();
      if (messaging) {
        onMessage(messaging, (payload) => {
          console.log('Foreground message:', payload);
        });
      }
    };
    setupMessaging();
  }, []);

  return { permission, token, requestPermission };
}
