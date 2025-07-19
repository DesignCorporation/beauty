/**
 * Email Channel Implementation for Beauty Platform
 * 
 * Handles SMTP email sending with template support and
 * HTML/text formatting.
 */

import { IMessageChannel, Message, ChannelConfig, SendResult, MessageType } from '../types';
import nodemailer from 'nodemailer';
import { createTransport, Transporter } from 'nodemailer';

export class EmailChannel implements IMessageChannel {
  readonly name = 'email' as const;
  private transporters = new Map<string, Transporter>();

  async send(message: Message, config: ChannelConfig): Promise<SendResult> {
    const emailConfig = config.email;
    if (!emailConfig) {
      throw new Error('Email configuration not found');
    }

    try {
      const transporter = this.getTransporter(emailConfig);
      
      // Format message for email
      const emailMessage = this.formatMessage(message, emailConfig);
      
      const result = await transporter.sendMail(emailMessage);
      
      return {
        success: true,
        messageId: message.id,
        externalId: result.messageId,
        deliveredAt: new Date()
      };

    } catch (error) {
      console.error('Email send error:', error);
      
      return {
        success: false,
        error: {
          code: 'EMAIL_SEND_ERROR',
          message: error.message,
          retryable: this.isRetryableError(error)
        }
      };
    }
  }

  // Email doesn't support incoming messages in this implementation
  async receive?(webhookData: any, tenantId?: string): Promise<Message | null> {
    // Could implement IMAP/POP3 reading in the future
    return null;
  }

  isConfigured(config: ChannelConfig): boolean {
    const email = config.email;
    return !!(
      email?.smtpHost &&
      email?.smtpPort &&
      email?.smtpUser &&
      email?.smtpPass &&
      email?.fromEmail
    );
  }

  validateConfig(config: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!config.smtpHost) {
      errors.push('SMTP host is required');
    }
    
    if (!config.smtpPort) {
      errors.push('SMTP port is required');
    } else if (isNaN(config.smtpPort) || config.smtpPort < 1 || config.smtpPort > 65535) {
      errors.push('SMTP port must be a valid port number');
    }
    
    if (!config.smtpUser) {
      errors.push('SMTP username is required');
    }
    
    if (!config.smtpPass) {
      errors.push('SMTP password is required');
    }
    
    if (!config.fromEmail) {
      errors.push('From email address is required');
    } else if (!this.isValidEmail(config.fromEmail)) {
      errors.push('From email address is not valid');
    }
    
    if (config.replyToEmail && !this.isValidEmail(config.replyToEmail)) {
      errors.push('Reply-to email address is not valid');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  getSupportedTypes(): MessageType[] {
    return ['text', 'template'];
  }

  formatMessage(message: Message, emailConfig: ChannelConfig['email']): any {
    const emailMessage: any = {
      from: {
        name: emailConfig?.fromName || 'Beauty Salon',
        address: emailConfig?.fromEmail
      },
      to: this.extractRecipientEmail(message),
      subject: this.extractSubject(message),
      text: message.content.text || '',
      html: this.generateHtmlContent(message),
    };

    if (emailConfig?.replyToEmail) {
      emailMessage.replyTo = emailConfig.replyToEmail;
    }

    // Add custom headers for tracking
    emailMessage.headers = {
      'X-Message-ID': message.id,
      'X-Tenant-ID': message.tenantId,
      'X-Channel': 'email'
    };

    if (message.metadata.threadId) {
      emailMessage.headers['X-Thread-ID'] = message.metadata.threadId;
    }

    return emailMessage;
  }

  /**
   * Test email configuration
   */
  async testConnection(emailConfig: ChannelConfig['email']): Promise<boolean> {
    try {
      const transporter = this.createTransporter(emailConfig);
      await transporter.verify();
      return true;
    } catch (error) {
      console.error('Email connection test failed:', error);
      return false;
    }
  }

  // Private helper methods

  private getTransporter(emailConfig: ChannelConfig['email']): Transporter {
    const key = this.getConfigKey(emailConfig);
    
    if (!this.transporters.has(key)) {
      const transporter = this.createTransporter(emailConfig);
      this.transporters.set(key, transporter);
    }
    
    return this.transporters.get(key)!;
  }

  private createTransporter(emailConfig: ChannelConfig['email']): Transporter {
    return createTransport({
      host: emailConfig?.smtpHost,
      port: emailConfig?.smtpPort,
      secure: emailConfig?.smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: emailConfig?.smtpUser,
        pass: emailConfig?.smtpPass
      },
      // Connection timeout
      connectionTimeout: 10000,
      // Socket timeout
      socketTimeout: 10000,
      // Greeting timeout
      greetingTimeout: 5000
    });
  }

  private getConfigKey(emailConfig: ChannelConfig['email']): string {
    return `${emailConfig?.smtpHost}:${emailConfig?.smtpPort}:${emailConfig?.smtpUser}`;
  }

  private extractRecipientEmail(message: Message): string {
    // Try to get email from metadata
    if (message.metadata.recipientEmail) {
      return message.metadata.recipientEmail;
    }

    // Try to get from client ID (assuming it might be an email)
    if (message.clientId && this.isValidEmail(message.clientId)) {
      return message.clientId;
    }

    throw new Error('No recipient email found for message');
  }

  private extractSubject(message: Message): string {
    // Check if subject is provided in metadata
    if (message.metadata.subject) {
      return message.metadata.subject;
    }

    // Extract from template if available
    if (message.content.template) {
      return `Beauty Salon - ${message.content.template.code}`;
    }

    // Default subject
    return 'Message from Beauty Salon';
  }

  private generateHtmlContent(message: Message): string {
    const textContent = message.content.text || '';
    
    // Basic HTML template
    const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Beauty Salon Message</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f5f5f5;
            }
            .container {
                background-color: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #667eea;
            }
            .logo {
                font-size: 24px;
                font-weight: bold;
                color: #667eea;
                margin-bottom: 10px;
            }
            .content {
                font-size: 16px;
                line-height: 1.8;
                margin-bottom: 30px;
            }
            .footer {
                text-align: center;
                font-size: 12px;
                color: #666;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
            }
            .cta-button {
                display: inline-block;
                background-color: #667eea;
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
                font-weight: bold;
            }
            .social-links {
                margin-top: 20px;
            }
            .social-links a {
                color: #667eea;
                text-decoration: none;
                margin: 0 10px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">Beauty Salon</div>
                <div>Your Beauty Partner</div>
            </div>
            
            <div class="content">
                ${this.formatTextToHtml(textContent)}
            </div>
            
            <div class="footer">
                <p>This message was sent from Beauty Salon management system.</p>
                <p>If you have any questions, please don't hesitate to contact us.</p>
                <div class="social-links">
                    <a href="#">Website</a> |
                    <a href="#">Instagram</a> |
                    <a href="#">Facebook</a>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

    return htmlTemplate;
  }

  private formatTextToHtml(text: string): string {
    return text
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>')
      // Make URLs clickable
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1">$1</a>')
      // Make email addresses clickable
      .replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '<a href="mailto:$1">$1</a>');
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isRetryableError(error: any): boolean {
    // Check for network errors, timeouts, or temporary server issues
    const retryableErrors = [
      'ECONNRESET',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
      'EHOSTUNREACH'
    ];
    
    return retryableErrors.some(code => 
      error.code === code || error.message.includes(code)
    );
  }
}
