import nodemailer from 'nodemailer';
import { SendVerificationCodePort, SendVerificationCodePortData } from '../../../features/auth/application/ports/SendVerificationCodePort';
import { LoggerPort } from '../../../shared/ports/LoggerPort';
import { EmailConfiguration } from '../../config/email.config';

export class NodemailerVerificationCodeSender implements SendVerificationCodePort {
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

  async send(data: SendVerificationCodePortData): Promise<void> {
    try {
      this.logger.info('Sending verification code email', { 
        customerId: data.customerId,
        recipientEmail: data.email,
        customerName: data.customerName
      });

      const mailOptions = {
        from: this.config.getFromEmail(),
        to: data.email,
        subject: this.buildSubject(),
        html: this.buildEmailContent(data)
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      this.logger.info('Verification code email sent successfully', { 
        customerId: data.customerId,
        recipientEmail: data.email,
        messageId: result.messageId 
      });
    } catch (error) {
      this.logger.error('Error sending verification code email', error as Error, { 
        customerId: data.customerId,
        recipientEmail: data.email,
        customerName: data.customerName,
        error: error instanceof Error ? error.message : String(error) 
      });
      throw new Error(`Failed to send verification code email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildSubject(): string {
    return '🔐 Your Verification Code - Learn Every Day';
  }

  private buildEmailContent(data: SendVerificationCodePortData): string {
    const { customerName, verificationCode } = data;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verification Code - Learn Every Day</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .content { background-color: #ffffff; padding: 20px; border-radius: 8px; }
          .verification-code { 
            background-color: #e3f2fd; 
            padding: 15px; 
            border-radius: 8px; 
            text-align: center; 
            margin: 20px 0;
            font-size: 24px;
            font-weight: bold;
            letter-spacing: 3px;
            color: #1976d2;
          }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .warning { 
            background-color: #fff3cd; 
            border: 1px solid #ffeaa7; 
            padding: 10px; 
            border-radius: 4px; 
            margin: 15px 0;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Learn Every Day</h1>
            <p><strong>Hello ${customerName},</strong></p>
            <p><strong>Confira no App:</strong> <a href="https://learn-every-day-nextjs.vercel.app/">Learn Everyday</a></p>
            <p>You requested a verification code to access your account.</p>
          </div>
          
          <div class="content">
            <h2>Your Verification Code</h2>
            <p>Please use the following verification code to complete your login:</p>
            
            <div class="verification-code">
              ${verificationCode}
            </div>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong><br>
              This code will expire in 10 minutes. Do not share this code with anyone.
            </div>
            
            <p>If you didn't request this code, please ignore this email or contact our support team.</p>
          </div>
          
          <div class="footer">
            <p>This is an automated email from Learn Every Day. Please do not reply to this message.</p>
            <p>If you have any questions, please contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
} 