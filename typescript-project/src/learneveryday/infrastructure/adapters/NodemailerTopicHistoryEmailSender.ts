import nodemailer from 'nodemailer';
import { SendTopicHistoryByEmailPort, SendTopicHistoryByEmailPortData } from '../../domain/topic-history/ports/SendTopicHistoryByEmailPort';
import { EmailConfiguration } from '../config/email.config';
import moment from 'moment';
import fs from 'fs';
import path from 'path';

export class NodemailerTopicHistoryEmailSender implements SendTopicHistoryByEmailPort {
  private readonly emailConfig: EmailConfiguration;
  private transporter: nodemailer.Transporter;

  constructor() {
    this.emailConfig = EmailConfiguration.getInstance();
    this.transporter = nodemailer.createTransport({
      host: this.emailConfig.getHost(),
      port: this.emailConfig.getPort(),
      secure: this.emailConfig.isSecure(),
      auth: {
        user: this.emailConfig.getUser(),
        pass: this.emailConfig.getPass()
      },
      // Gmail-specific settings
      tls: {
        rejectUnauthorized: false
      },
      // Connection timeout settings
      connectionTimeout: 60000, // 60 seconds
      greetingTimeout: 30000,   // 30 seconds
      socketTimeout: 60000      // 60 seconds
    });
    
  }


  async send(data: SendTopicHistoryByEmailPortData): Promise<void> {
    try {
      // Verify connection before sending
      await this.verifyConnection();
      
      const { email, topicHistory, topicSubject } = data;
      
      const subject = this.buildSubject(topicHistory, topicSubject);
      const htmlContent = this.buildHtmlContent(topicHistory, topicSubject);
      const textContent = this.buildTextContent(topicHistory, topicSubject);

      const mailOptions = {
        from: this.emailConfig.getFrom(),
        to: email,
        subject: subject,
        text: textContent,
        html: htmlContent,
        // Gmail-specific headers
        headers: {
          'X-Priority': '3',
          'X-MSMail-Priority': 'Normal',
          'Importance': 'Normal'
        }
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      if (!result.messageId) {
        throw new Error('Failed to send email: No message ID returned');
      }

      console.log(`✅ Email sent successfully to ${email} with message ID: ${result.messageId}`);

    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      throw new Error(`Failed to send topic history email: ${errorMessage}`);
    }
  }

  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      throw new Error(`Email connection verification failed: ${errorMessage}`);
    }
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      // Handle common Gmail-specific errors
      if (error.message.includes('Invalid login')) {
        return 'Invalid Gmail credentials. Please check your email and app password. Make sure you\'re using a 16-character app password, not your regular Gmail password.';
      }
      if (error.message.includes('Less secure app access')) {
        return 'Gmail requires an App Password when 2-Factor Authentication is enabled. Please generate an App Password in your Google Account settings.';
      }
      if (error.message.includes('Rate limit exceeded')) {
        return 'Gmail rate limit exceeded. Please wait before sending more emails.';
      }
      if (error.message.includes('Connection timeout')) {
        return 'Connection to Gmail timed out. Please check your internet connection and try again.';
      }
      return error.message;
    }
    return 'Unknown error occurred';
  }

  private buildSubject(topicHistory: any, topicSubject?: string): string {
    const date = moment(topicHistory.createdAt).format('MMMM D, YYYY');
    const subject = topicSubject || 'Learning Topic';
    return `📚 New Learning Entry: ${subject} - ${date}`;
  }

  private buildHtmlContent(topicHistory: any, topicSubject?: string): string {
    const date = moment(topicHistory.createdAt).format('MMMM D, YYYY [at] h:mm A');
    const subject = topicSubject || 'Learning Topic';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Learning Entry</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
          }
          .container {
            background-color: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e9ecef;
          }
          .logo {
            max-width: 120px;
            height: auto;
            margin-bottom: 15px;
          }
          .header h1 {
            color: #2c3e50;
            margin: 0;
            font-size: 24px;
          }
          .header .date {
            color: #6c757d;
            font-size: 14px;
            margin-top: 5px;
          }
          .topic-info {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            border-left: 4px solid #007bff;
          }
          .topic-info h3 {
            margin: 0 0 10px 0;
            color: #495057;
          }
          .content {
            background-color: #fff;
            padding: 20px;
            border-radius: 5px;
            border: 1px solid #dee2e6;
            margin-bottom: 20px;
          }
          .content p {
            margin: 0;
            line-height: 1.8;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            color: #6c757d;
            font-size: 12px;
          }
          .highlight {
            background-color: #fff3cd;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #ffc107;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📚 New Learning Entry</h1>
            <div class="date">${date}</div>
          </div>
          
          <div class="topic-info">
            <h3>🎯 Topic: ${subject}</h3>
            <p><strong>Entry ID:</strong> ${topicHistory.id}</p>
            <p><strong>Created:</strong> ${date}</p>
          </div>
          
          <div class="content">
            <h3>📝 Learning Content:</h3>
            <p>${topicHistory.content.replace(/\n/g, '<br>')}</p>
          </div>
          
          <div class="highlight">
            <strong>💡 Keep Learning:</strong> This entry has been automatically generated and saved to your learning history. 
            Continue building on this knowledge in your next learning session!
          </div>
          
          <div class="footer">
            <p>This email was automatically generated by your Learning Every Day system.</p>
            <p>Entry ID: ${topicHistory.id} | Topic ID: ${topicHistory.topicId}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private buildTextContent(topicHistory: any, topicSubject?: string): string {
    const date = moment(topicHistory.createdAt).format('MMMM D, YYYY [at] h:mm A');
    const subject = topicSubject || 'Learning Topic';
    
    return `
📚 New Learning Entry

🎯 Topic: ${subject}
📅 Date: ${date}
🆔 Entry ID: ${topicHistory.id}

📝 Learning Content:
${topicHistory.content}

💡 Keep Learning: This entry has been automatically generated and saved to your learning history. Continue building on this knowledge in your next learning session!

---
This email was automatically generated by your Learning Every Day system.
Entry ID: ${topicHistory.id} | Topic ID: ${topicHistory.topicId}
    `.trim();
  }
} 