import nodemailer from 'nodemailer';
import { LoggerPort } from '../../shared/ports/LoggerPort';
import { EmailConfiguration } from '../config/email.config';
import { SendTopicClosedEmailPort, SendTopicClosedEmailPortData } from '@/learneveryday/features/topic/application/ports/SendTopicClosedEmailPort';

export class NodemailerTopicClosedEmailSender implements SendTopicClosedEmailPort {
  private transporter: nodemailer.Transporter;
  private readonly config: EmailConfiguration;

  constructor(private readonly logger: LoggerPort) {
    this.config = EmailConfiguration.getInstance();
    this.transporter = nodemailer.createTransport({
      host: this.config.getHost(),
      port: this.config.getPort(),
      secure: this.config.isSecure(),
      auth: {
        user: this.config.getUsername(),
        pass: this.config.getPassword()
      }
    });
  }

  async send(data: SendTopicClosedEmailPortData): Promise<void> {
    try {
      this.logger.info('Sending topic closed email', { 
        customerId: data.customerId,
        recipientEmail: data.email,
        topicSubject: data.topicSubject
      });

      const mailOptions = {
        from: this.config.getFromEmail(),
        to: data.email,
        subject: this.buildSubject(data.topicSubject),
        html: this.buildEmailContent(data)
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      this.logger.info('Topic closed email sent successfully', { 
        customerId: data.customerId,
        recipientEmail: data.email,
        messageId: result.messageId 
      });
    } catch (error) {
      this.logger.error('Error sending topic closed email', error as Error, { 
        customerId: data.customerId,
        recipientEmail: data.email,
        topicSubject: data.topicSubject,
        error: error instanceof Error ? error.message : String(error) 
      });
      throw new Error(`Failed to send topic closed email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildSubject(topicSubject: string): string {
    return `🔒 Tópico Fechado: ${topicSubject} - Learn Every Day`;
  }

  private buildEmailContent(data: SendTopicClosedEmailPortData): string {
    const { topicSubject } = data;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Tópico Fechado - Learn Every Day</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .content { background-color: #ffffff; padding: 20px; border-radius: 8px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Tópico Fechado - Learn Every Day</h1>
            <p>O tópico "${topicSubject}" foi fechado.</p>
            <p>Para mais informações, visite o app: <a href="https://learn-every-day-nextjs.vercel.app/">Learn Every Day</a></p>
          </div>
          
          <div class="content">
            <p>Você pode revisar os tópicos fechados no seu perfil.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}