import { Request, Response } from 'express';
import { buildBrandEmailTemplate, sendEmail } from '../utils/email';

export const createContactMessage = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { name, email, phone, subject, message } = req.body || {};
    const recipient = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM || process.env.EMAIL_USER || 'mokshyafoods@gmail.com';
    const { html, text } = buildBrandEmailTemplate({
      title: 'New contact form submission',
      greeting: `Hello ${process.env.ADMIN_NAME || 'Admin'},`,
      intro: 'A new public contact form submission has arrived.',
      bodyHtml: `<p><strong>Name:</strong> ${name || 'N/A'}</p><p><strong>Email:</strong> ${email || 'N/A'}</p><p><strong>Phone:</strong> ${phone || 'N/A'}</p><p><strong>Subject:</strong> ${subject || 'N/A'}</p><p><strong>Message:</strong><br />${message || 'N/A'}</p>`,
      bodyText: `Name: ${name || 'N/A'}\nEmail: ${email || 'N/A'}\nPhone: ${phone || 'N/A'}\nSubject: ${subject || 'N/A'}\nMessage: ${message || 'N/A'}`,
      footerNote: 'This email was generated from the public contact form.',
    });

    await sendEmail({
      to: recipient,
      subject: `New contact enquiry: ${subject || 'Website contact'}`,
      html,
      text,
      replyTo: email,
    });

    return res.status(201).json({
      success: true,
      message: 'Contact message received successfully',
      data: {
        _id: 'contact-local',
        status: 'new',
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('createContactMessage error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to send contact message' });
  }
};

export const getAllMessages = async (_req: Request, res: Response): Promise<Response> => {
  return res.status(200).json({ success: true, data: [] });
};

export const updateMessageStatus = async (req: Request, res: Response): Promise<Response> => {
  const { status } = req.body ?? {};
  return res.status(200).json({
    success: true,
    message: `Status updated to ${status || 'updated'}`,
    data: {
      _id: req.params.id,
      status: status || 'new',
    },
  });
};

export default {
  createContactMessage,
  getAllMessages,
  updateMessageStatus,
};
