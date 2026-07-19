import axios from 'axios';
import nodemailer, { Transporter } from 'nodemailer';

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
}

interface EmailTemplateOptions {
  title: string;
  greeting?: string;
  intro?: string;
  bodyHtml?: string;
  bodyText?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
}

const getSenderEmail = (): string => process.env.EMAIL_FROM || process.env.EMAIL_USER || 'mokshyafoods@gmail.com';
const getSenderName = (): string => process.env.EMAIL_FROM_NAME || 'Mokshya Foods';
const getSenderAddress = (): string => `${getSenderName()} <${getSenderEmail()}>`;
const getReplyTo = (): string => process.env.REPLY_TO || process.env.EMAIL_FROM || process.env.EMAIL_USER || 'support@mokshyafoods.com';
const getCompanyAddress = (): string => process.env.COMPANY_ADDRESS || 'Mokshya Foods, Kathmandu, Nepal';
const getConfiguredEmailService = (): string => {
  const configuredService = process.env.EMAIL_SERVICE?.trim().toLowerCase();
  if (configuredService) return configuredService;
  if (process.env.EMAIL_USER || process.env.EMAIL_FROM || process.env.EMAIL_APP_PASSWORD || process.env.EMAIL_PASSWORD) {
    return 'gmail';
  }
  return '';
};
const getSocialLinks = (): { label: string; url: string }[] => [
  { label: 'Instagram', url: 'https://instagram.com/mokshyafoods' },
  { label: 'Facebook', url: 'https://facebook.com/mokshyafoods' },
];

const getDeliveryHeaders = (): Record<string, string> => ({
  'Auto-Submitted': 'auto-generated',
  'X-Priority': '3',
  'Importance': 'normal',
  'List-Unsubscribe': `<mailto:${getReplyTo()}>`,
  'X-Mailer': 'Mokshya Foods Mailer',
  'X-Entity-Note': 'Verification email',
  'Precedence': 'bulk',
});

const createTransporter = (): Transporter | null => {
  const service = getConfiguredEmailService();

  if (!service || service === 'resend') {
    return null;
  }

  if (service === 'sendgrid') {
    return nodemailer.createTransport({
      service: 'SendGrid',
      auth: {
        user: 'apikey',
        pass: process.env.EMAIL_API_KEY || '',
      },
    });
  }

  if (process.env.EMAIL_SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_SMTP_HOST,
      port: Number(process.env.EMAIL_SMTP_PORT) || 587,
      secure: process.env.EMAIL_SMTP_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_SMTP_USER || '',
        pass: process.env.EMAIL_SMTP_PASSWORD || '',
      },
    });
  }

  const emailPassword = process.env.EMAIL_PASSWORD || process.env.EMAIL_APP_PASSWORD;

  if (process.env.EMAIL_USER && emailPassword) {
    return nodemailer.createTransport({
      service: service === 'gmail' ? 'gmail' : service,
      auth: {
        user: process.env.EMAIL_USER,
        pass: emailPassword,
      },
    });
  }

  if (service === 'gmail' && process.env.EMAIL_USER) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD || process.env.EMAIL_PASSWORD || '',
      },
    });
  }

  return null;
};

export const buildBrandEmailTemplate = ({ title, greeting, intro, bodyHtml, bodyText, ctaLabel, ctaUrl, footerNote }: EmailTemplateOptions): { html: string; text: string } => {
  const safeBodyHtml = bodyHtml || '';
  const safeBodyText = bodyText || '';
  const footerMessage = footerNote || 'Thank you for shopping with Mokshya Foods.';
  const socialLinks = getSocialLinks()
    .map((item) => `<a href="${item.url}" style="color:#f2f2f2;text-decoration:none;">${item.label}</a>`)
    .join(' &nbsp;•&nbsp; ');

  const html = `<!doctype html>
  <html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#f6efe6;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f6efe6;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:640px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.06);">
            <tr>
              <td style="background:#1f5f3b;padding:24px 20px;text-align:center;">
                <div style="display:inline-block;text-align:center;">
                  <div style="font-size:28px;font-weight:700;letter-spacing:0.12em;color:#ffffff;text-transform:uppercase;">Mokshya Foods</div>
                  <div style="margin-top:6px;font-size:12px;color:#e7f0ea;letter-spacing:0.24em;text-transform:uppercase;">Pure • Natural • Trusted</div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 28px 20px;">
                <div style="font-size:16px;line-height:1.7;color:#374151;">
                  ${greeting ? `<p style="margin:0 0 12px;font-weight:600;color:#111827;">${greeting}</p>` : ''}
                  ${intro ? `<p style="margin:0 0 14px;">${intro}</p>` : ''}
                  ${safeBodyHtml}
                  ${ctaLabel && ctaUrl ? `<p style="margin:24px 0 0;"><a href="${ctaUrl}" style="display:inline-block;background:#1f5f3b;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:600;">${ctaLabel}</a></p>` : ''}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 28px;">
                <div style="border-top:1px solid #e5e7eb;padding-top:18px;font-size:12px;line-height:1.7;color:#6b7280;">
                  <div style="font-weight:700;color:#111827;">Mokshya Foods</div>
                  <div>${getCompanyAddress()}</div>
                  <div style="margin-top:8px;">${socialLinks}</div>
                  <div style="margin-top:8px;">© ${new Date().getFullYear()} Mokshya Foods. All rights reserved.</div>
                  ${footerMessage ? `<div style="margin-top:8px;">${footerMessage}</div>` : ''}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>`;

  const text = [
    title,
    greeting || '',
    intro || '',
    safeBodyText || '',
    footerMessage,
    `Mokshya Foods - ${getCompanyAddress()}`,
    `© ${new Date().getFullYear()} Mokshya Foods. All rights reserved.`,
  ].filter(Boolean).join('\n\n');

  return { html, text };
};

export const sendEmail = async ({ to, subject, html, text, replyTo }: SendEmailOptions): Promise<void> => {
  const normalizedSubject = subject.replace(/\s{2,}/g, ' ').replace(/[!]{2,}/g, '!').trim();
  const normalizedText = text || 'Thank you for choosing Mokshya Foods.';
  const normalizedHtml = html || `<p>Thank you for choosing Mokshya Foods.</p>`;

  if (getConfiguredEmailService().toLowerCase() === 'resend') {
    if (!process.env.EMAIL_API_KEY) {
      throw new Error('Missing EMAIL_API_KEY for Resend');
    }

    await axios.post(
      'https://api.resend.com/emails',
      {
        from: getSenderAddress(),
        to,
        reply_to: replyTo || getReplyTo(),
        subject: normalizedSubject,
        html: normalizedHtml,
        text: normalizedText,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.EMAIL_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return;
  }

  const transporter = createTransporter();
  if (!transporter) {
    throw new Error('No valid email transport configured');
  }

  const messageId = `<${Date.now()}.${Math.random().toString(36).slice(2)}@${process.env.EMAIL_DOMAIN || 'mokshyafoods.com'}>`;

  await transporter.sendMail({
    from: getSenderAddress(),
    to,
    replyTo: replyTo || getReplyTo(),
    subject: normalizedSubject,
    html: normalizedHtml,
    text: normalizedText,
    headers: getDeliveryHeaders(),
    messageId,
    priority: 'normal',
    dkim: process.env.EMAIL_DKIM_DOMAIN && process.env.EMAIL_DKIM_PRIVATE_KEY
      ? {
          domainName: process.env.EMAIL_DKIM_DOMAIN,
          keySelector: process.env.EMAIL_DKIM_SELECTOR || 'default',
          privateKey: process.env.EMAIL_DKIM_PRIVATE_KEY,
        }
      : undefined,
  });
};
