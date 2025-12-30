import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import nodemailer from 'nodemailer'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message, userEmail, userName } = await req.json()

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    if (message.length > 500) {
      return NextResponse.json({ error: 'Message must be 500 characters or less' }, { status: 400 })
    }

    // Create transporter - configure based on email domain
    const emailUser = process.env.SUPPORT_EMAIL_USER!
    const isGmail = emailUser.includes('@gmail.com')
    
    const transporter = nodemailer.createTransport({
      service: isGmail ? 'gmail' : undefined,
      host: isGmail ? undefined : 'smtp.gmail.com', // Use Gmail SMTP even for custom domains
      port: isGmail ? undefined : 587,
      secure: false,
      auth: {
        user: emailUser,
        pass: process.env.SUPPORT_EMAIL_PASSWORD,
      },
    })

    // Email content
    const mailOptions = {
      from: process.env.SUPPORT_EMAIL_USER,
      to: process.env.SUPPORT_EMAIL_USER, // Your email where you want to receive support messages
      subject: `Support Request from ${userName || userEmail}`,
      html: `
        <h2>Support Request</h2>
        <p><strong>From:</strong> ${userName || 'Unknown User'} (${userEmail})</p>
        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        <hr>
        <h3>Message:</h3>
        <p style="white-space: pre-wrap;">${message}</p>
      `,
    }

    // Send email
    await transporter.sendMail(mailOptions)

    return NextResponse.json({ 
      success: true, 
      message: 'Support message sent successfully' 
    })

  } catch (error) {
    console.error('Error sending support email:', error)
    return NextResponse.json(
      { error: 'Failed to send support message' }, 
      { status: 500 }
    )
  }
}
