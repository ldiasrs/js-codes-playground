import { EmailConfiguration } from '../infrastructure/config/email.config';
import nodemailer from 'nodemailer';

async function testGmailConfiguration() {
  console.log('🔧 Testing Gmail Configuration...\n');

  try {
    // Load configuration
    const emailConfig = EmailConfiguration.getInstance();
    
    console.log('📋 Configuration Details:');
    console.log(`   Host: ${emailConfig.getHost()}`);
    console.log(`   Port: ${emailConfig.getPort()}`);
    console.log(`   Secure: ${emailConfig.isSecure()}`);
    console.log(`   User: ${emailConfig.getUser()}`);
    console.log(`   From: ${emailConfig.getFrom()}`);
    console.log(`   Password: ${emailConfig.getPass() ? '***' + emailConfig.getPass().slice(-4) : 'Not set'}\n`);

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: emailConfig.getHost(),
      port: emailConfig.getPort(),
      secure: emailConfig.isSecure(),
      auth: {
        user: emailConfig.getUser(),
        pass: emailConfig.getPass()
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 30000,
      greetingTimeout: 15000,
      socketTimeout: 30000
    });

    console.log('🔌 Testing connection...');
    
    // Verify connection
    await transporter.verify();
    console.log('✅ Connection successful! Gmail configuration is working.\n');

    // Test sending a simple email
    console.log('📧 Testing email sending...');
    
    const testEmail = {
      from: emailConfig.getFrom(),
      to: emailConfig.getUser(), // Send to yourself for testing
      subject: '🧪 Gmail Configuration Test',
      text: 'This is a test email to verify your Gmail configuration is working correctly.',
      html: `
        <h2>🧪 Gmail Configuration Test</h2>
        <p>This is a test email to verify your Gmail configuration is working correctly.</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p>If you received this email, your Gmail setup is working perfectly! 🎉</p>
      `
    };

    const result = await transporter.sendMail(testEmail);
    
    if (result.messageId) {
      console.log('✅ Test email sent successfully!');
      console.log(`   Message ID: ${result.messageId}`);
      console.log(`   Sent to: ${emailConfig.getUser()}`);
      console.log('\n🎉 Your Gmail configuration is working perfectly!');
      console.log('You can now use the email features in your Learning Every Day application.');
    } else {
      console.log('❌ Test email failed: No message ID returned');
    }

  } catch (error) {
    console.error('❌ Configuration test failed:');
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid login')) {
        console.error('   🔑 Invalid Gmail credentials');
        console.error('   💡 Make sure you\'re using a 16-character app password, not your regular Gmail password');
        console.error('   📖 See GMAIL_SETUP.md for detailed instructions');
      } else if (error.message.includes('Less secure app access')) {
        console.error('   🔐 Gmail requires an App Password when 2FA is enabled');
        console.error('   💡 Generate an App Password in your Google Account settings');
        console.error('   📖 See GMAIL_SETUP.md for detailed instructions');
      } else if (error.message.includes('Rate limit exceeded')) {
        console.error('   ⏰ Gmail rate limit exceeded');
        console.error('   💡 Wait a few minutes before trying again');
      } else if (error.message.includes('Connection timeout')) {
        console.error('   🌐 Connection timeout');
        console.error('   💡 Check your internet connection');
      } else {
        console.error(`   ${error.message}`);
      }
    } else {
      console.error('   Unknown error occurred');
    }
    
    console.log('\n📖 For help, see GMAIL_SETUP.md');
  }
}

// Run the test
testGmailConfiguration().catch(console.error); 