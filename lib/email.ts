import nodemailer from "nodemailer"
import { validateEnv } from "@/lib/env"

const env = validateEnv()

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null

try {
  if (env.EMAIL_SERVER_HOST && env.EMAIL_SERVER_PORT && env.EMAIL_SERVER_USER && env.EMAIL_SERVER_PASSWORD) {
    transporter = nodemailer.createTransport({
      host: env.EMAIL_SERVER_HOST,
      port: env.EMAIL_SERVER_PORT,
      secure: env.EMAIL_SERVER_PORT === 465,
      auth: {
        user: env.EMAIL_SERVER_USER,
        pass: env.EMAIL_SERVER_PASSWORD,
      },
    })
    console.log("Email transporter initialized successfully")
  } else {
    console.warn("Email configuration not provided. Email functionality will be disabled.")
  }
} catch (error) {
  console.error("Failed to initialize email transporter:", error)
}

interface SendEmailOptions {
  to: string
  subject: string
  text?: string
  html?: string
}

export async function sendEmail({ to, subject, text, html }: SendEmailOptions) {
  if (!transporter) {
    console.warn("Email transporter not initialized. Email not sent.")
    return false
  }

  try {
    const from = env.EMAIL_FROM || env.EMAIL_SERVER_USER

    const info = await transporter.sendMail({
      from: `"Agent DOC" <${from}>`,
      to,
      subject,
      text,
      html,
    })

    console.log("Email sent:", info.messageId)
    return true
  } catch (error) {
    console.error("Failed to send email:", error)
    return false
  }
}

export function getWelcomeEmailHtml(name: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #e63946;">Welcome to Agent DOC!</h1>
      <p>Hello ${name},</p>
      <p>Thank you for signing up for Agent DOC. We're excited to have you on board!</p>
      <p>With Agent DOC, you can:</p>
      <ul>
        <li>Upload and process PDF documents</li>
        <li>Chat with your documents using AI</li>
        <li>Organize documents into collections</li>
      </ul>
      <p>To get started, simply log in to your account and upload your first document.</p>
      <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
      <p>Best regards,<br>The Agent DOC Team</p>
    </div>
  `
}
