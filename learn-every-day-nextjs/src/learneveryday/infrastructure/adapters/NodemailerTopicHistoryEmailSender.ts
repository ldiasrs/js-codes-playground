import nodemailer from 'nodemailer';
import { SendTopicHistoryByEmailPort, SendTopicHistoryByEmailPortData } from '../../domain/topic-history/ports/SendTopicHistoryByEmailPort';
import { LoggerPort } from '../../domain/shared/ports/LoggerPort';
import { EmailConfiguration } from '../config/email.config';

export class NodemailerTopicHistoryEmailSender implements SendTopicHistoryByEmailPort {
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

  async send(data: SendTopicHistoryByEmailPortData): Promise<void> {
    try {
      this.logger.info('Sending topic history email', { 
        topicId: data.topicHistory.topicId, 
        recipientEmail: data.email 
      });

      const mailOptions = {
        from: this.config.getFromEmail(),
        to: data.email,
        subject: this.buildSubject(data.topicSubject || 'Aprendizado Diário'),
        html: this.buildEmailContent(data)
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      this.logger.info('Topic history email sent successfully', { 
        topicId: data.topicHistory.topicId, 
        messageId: result.messageId 
      });
    } catch (error) {
      this.logger.error('Error sending topic history email', error as Error,  { 
        topicId: data.topicHistory.topicId, 
        recipientEmail: data.email,
        error: error instanceof Error ? error.message : String(error) 
      });
      throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildSubject(topicSubject: string): string {
    return `📚 Aprendizado Diário: ${topicSubject}`;
  }

  private buildEmailContent(data: SendTopicHistoryByEmailPortData): string {
    const { topicHistory, topicSubject } = data;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Aprendizado Diário</title>
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
            <h1>📚 Aprendizado Diário</h1>
            <p><strong>Tópico:</strong> ${topicSubject || 'Aprendizado Diário'}</p>
            <p><strong>Data:</strong> ${topicHistory.createdAt.toLocaleDateString('pt-BR')}</p>
          </div>
          
          <div class="content">
            ${topicHistory.content.replace(/\n/g, '<br>')}
          </div>
          
          <div class="footer">
            <p>Este é um email automático do sistema de aprendizado diário.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
} 