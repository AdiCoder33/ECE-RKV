export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const existing = await navigator.serviceWorker.getRegistration();
    if (existing) return existing;
    return await navigator.serviceWorker.register('/sw.js');
  } catch (err) {
    console.error('Service worker registration failed', err);
    return null;
  }
}

export async function getPublicKey(): Promise<string> {
  const apiBase = import.meta.env.VITE_API_URL || '/api';
  const res = await fetch(`${apiBase}/push/public-key`);
  if (!res.ok) throw new Error('Failed to retrieve public key');
  const data = await res.json();
  return data.publicKey as string;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function enablePush(topics: string[] = [], userId?: string | number): Promise<PushSubscription | null> {
  const registration = await registerServiceWorker();
  if (!registration) return null;
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Permission denied');
  const publicKey = await getPublicKey();
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });
  const apiBase = import.meta.env.VITE_API_URL || '/api';
  await fetch(`${apiBase}/push/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription, topics, userId }),
  });
  return subscription;
}

export async function disablePush(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    const apiBase = import.meta.env.VITE_API_URL || '/api';
    try {
      await fetch(`${apiBase}/push/unsubscribe`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
    } catch (err) {
      console.error('Failed to notify server about unsubscription', err);
    }
    await subscription.unsubscribe();
  }
}

export async function isSubscribed(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  return !!subscription;
}
