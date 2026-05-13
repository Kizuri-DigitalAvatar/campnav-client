"use client"

// Helper to convert VAPID key
const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}

export async function registerPushNotifications() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('Push notifications not supported')
        return null
    }

    try {
        const registration = await navigator.serviceWorker.register('/sw.js')

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '')
        })

        return subscription
    } catch (error) {
        console.error('Error registering push notifications:', error)
        return null
    }
}

export async function sendPushNotification(subscription: PushSubscription, message: string) {
    try {
        const response = await fetch('/api/notifications/push', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                subscription,
                message,
            }),
        })

        return response.ok
    } catch (error) {
        console.error('Error sending push notification:', error)
        return false
    }
}
