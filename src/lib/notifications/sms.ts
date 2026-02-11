// SMS notification service
// Use a provider like Twilio

export async function sendSmsNotification(to: string, message: string) {
    try {
        const response = await fetch('/api/notifications/sms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to,
                message,
            }),
        })

        return response.ok
    } catch (error) {
        console.error('Error sending SMS:', error)
        return false
    }
}

export const SMS_TEMPLATES = {
    ASSIGNMENT_NEW: (roomNumber: string) =>
        `CAMPNAV: New task assigned for ${roomNumber}. Please check app.`,

    REMINDER: (roomNumber: string) =>
        `CAMPNAV REMINDER: Pending task for ${roomNumber}. Please acknowledge immediately.`,
}
