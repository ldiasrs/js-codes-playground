import nodemailer from 'nodemailer';
import { marked } from 'marked';
import { SendTopicHistoryByEmailPort, SendTopicHistoryByEmailPortData } from '../../features/topic-histoy/application/ports/SendTopicHistoryByEmailPort';
import { LoggerPort } from '../../shared/ports/LoggerPort';
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
        customerId: data.customerId,
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
        customerId: data.customerId,
        topicId: data.topicHistory.topicId, 
        messageId: result.messageId 
      });
    } catch (error) {
      this.logger.error('Error sending topic history email', error as Error,  { 
        customerId: data.customerId,
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
    const htmlContent = this.convertMarkdownToHtml(topicHistory.content);
    
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
          .content ul, .content ol { padding-left: 20px; }
          .content li { margin-bottom: 8px; }
          .content h1, .content h2, .content h3 { margin-top: 20px; margin-bottom: 10px; }
          .content p { margin-bottom: 10px; }
          .content strong { font-weight: bold; }
          .content em { font-style: italic; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📚 Aprendizado Diário</h1>
            <p><strong>Tópico:</strong> ${topicSubject || 'Aprendizado Diário'}</p>
            <p><strong>Confira no App:</strong> <a href="https://learn-every-day-nextjs.vercel.app/">Learn Everyday</a></p>
            <p><strong>Data:</strong> ${topicHistory.createdAt.toLocaleDateString('pt-BR')}</p>
          </div>
          
          <div class="content">
            ${htmlContent}
          </div>
          
          <div class="footer">
            <p>Este é um email automático do sistema de aprendizado diário.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Converts markdown content to HTML
   * @param markdownContent The markdown formatted content
   * @returns string The HTML formatted content
   */
  private convertMarkdownToHtml(markdownContent: string): string {
    try {
      return marked.parse(markdownContent) as string;
    } catch (error) {
      this.logger.error('Error converting markdown to HTML', error as Error, {
        error: error instanceof Error ? error.message : String(error)
      });
      return markdownContent.replace(/\n/g, '<br>');
    }
  }
} 