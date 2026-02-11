// Email notification service
// Use a provider like Resend or SendGrid

export async function sendEmailNotification(to: string, subject: string, html: string) {
    try {
        const response = await fetch('/api/notifications/email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to,
                subject,
                html,
            }),
        })

        return response.ok
    } catch (error) {
        console.error('Error sending email:', error)
        return false
    }
}

export const EMAIL_TEMPLATES = {
    ASSIGNMENT_NEW: (roomNumber: string, serviceType: string) => `
    <h1>New Assignment</h1>
    <p>You have been assigned a new ${serviceType} task for room ${roomNumber}.</p>
    <p>Please log in to the app to acknowledge and start this assignment.</p>
  `,
    REMINDER: (roomNumber: string, serviceType: string) => `
    <h1>Assignment Reminder</h1>
    <p>This is a reminder for your pending ${serviceType} task for room ${roomNumber}.</p>
    <p>Please acknowledge this assignment immediately.</p>
  `,
}
