/**
 * TP-06: Email Service для отправки сообщений через SMTP
 * Поддержка nodemailer с различными провайдерами
 */

import nodemailer from 'nodemailer';
import { MessageSendResult, MessageMeta } from '../types/messaging';

export interface EmailConfig {
  host: string;
  port: number;
  secure?: boolean; // true для 465, false для других портов
  auth: {
    user: string;
    pass: string;
  };
  from: string; // email отправителя
}

export interface EmailContent {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;
    this.transporter = nodemailer.createTransporter({
      host: config.host,
      port: config.port,
      secure: config.secure || config.port === 465,
      auth: config.auth,
      // Дополнительные настройки для надежности
      pool: true, // использовать pool соединений
      maxConnections: 5,
      maxMessages: 100,
      tls: {
        rejectUnauthorized: false // для self-signed сертификатов
      }
    });
  }

  /**
   * Отправляет email сообщение
   */
  async sendEmail(content: EmailContent): Promise<MessageSendResult> {
    try {
      // Валидация email адресов
      if (!this.isValidEmail(content.to)) {
        return {
          success: false,
          status: 'FAILED',
          error: 'Invalid recipient email address'
        };
      }

      const mailOptions = {
        from: this.config.from,
        to: content.to,
        subject: content.subject,
        text: content.text,
        html: content.html,
        replyTo: content.replyTo || this.config.from,
        // Дополнительные заголовки
        headers: {
          'X-Mailer': 'Beauty Platform v1.0',
          'X-Priority': '3' // Normal priority
        }
      };

      const info = await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: info.messageId,
        status: 'SENT',
        deliveredAt: new Date()
      };

    } catch (error) {
      console.error('Email send error:', error);
      
      let errorMessage = 'Failed to send email';
      if (error instanceof Error) {
        // Обработка специфичных ошибок SMTP
        if (error.message.includes('Invalid login')) {
          errorMessage = 'SMTP authentication failed';
        } else if (error.message.includes('Connection timeout')) {
          errorMessage = 'SMTP connection timeout';
        } else if (error.message.includes('ENOTFOUND')) {
          errorMessage = 'SMTP server not found';
        } else if (error.message.includes('550')) {
          errorMessage = 'Recipient email rejected by server';
        } else {
          errorMessage = error.message;
        }
      }

      return {
        success: false,
        status: 'FAILED',
        error: errorMessage
      };
    }
  }

  /**
   * Проверяет соединение с SMTP сервером
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('SMTP verification failed:', error);
      return false;
    }
  }

  /**
   * Закрывает соединение с SMTP сервером
   */
  async close(): Promise<void> {
    this.transporter.close();
  }

  /**
   * Проверяет валидность email адреса
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Создает HTML версию текстового сообщения
   */
  static createHtmlFromText(text: string, salonName?: string): string {
    // Простая конвертация text в HTML с базовой стилизацией
    const htmlText = text
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Wiadomość od ${salonName || 'Beauty Salon'}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f9f9f9;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #667eea;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #667eea;
            margin: 0;
            font-size: 24px;
        }
        .content {
            font-size: 16px;
            line-height: 1.8;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #666;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${salonName || 'Beauty Salon'}</h1>
        </div>
        <div class="content">
            ${htmlText}
        </div>
        <div class="footer">
            Wiadomość wysłana automatycznie przez Beauty Platform<br>
            Nie odpowiadaj na ten email.
        </div>
    </div>
</body>
</html>
    `.trim();
  }

  /**
   * Создает metadata для email сообщения
   */
  static createMessageMeta(
    to: string,
    subject: string,
    messageId?: string
  ): MessageMeta {
    return {
      to,
      subject,
      messageId: messageId || undefined
    };
  }
}

// Предустановленные конфигурации для популярных провайдеров
export const EmailProviderConfigs = {
  // Gmail SMTP
  gmail: (user: string, password: string): Omit<EmailConfig, 'from'> => ({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: { user, pass: password }
  }),

  // Outlook/Hotmail SMTP
  outlook: (user: string, password: string): Omit<EmailConfig, 'from'> => ({
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    auth: { user, pass: password }
  }),

  // Yahoo SMTP
  yahoo: (user: string, password: string): Omit<EmailConfig, 'from'> => ({
    host: 'smtp.mail.yahoo.com',
    port: 587,
    secure: false,
    auth: { user, pass: password }
  }),

  // Mailgun SMTP
  mailgun: (domain: string, apiKey: string): Omit<EmailConfig, 'from'> => ({
    host: 'smtp.mailgun.org',
    port: 587,
    secure: false,
    auth: { user: `postmaster@${domain}`, pass: apiKey }
  }),

  // SendGrid SMTP
  sendgrid: (apiKey: string): Omit<EmailConfig, 'from'> => ({
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    auth: { user: 'apikey', pass: apiKey }
  })
};

/**
 * Создает email service из сохраненной конфигурации салона
 */
export function createEmailServiceFromSalonConfig(
  smtpHost: string,
  smtpPort: number,
  smtpUser: string,
  smtpPassword: string,
  smtpFrom: string
): EmailService {
  const config: EmailConfig = {
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPassword
    },
    from: smtpFrom
  };

  return new EmailService(config);
}
