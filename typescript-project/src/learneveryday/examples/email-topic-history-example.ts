import { EmailSenderFactory } from '../infrastructure/factories/EmailSenderFactory';
import { TopicHistory } from '../domain/topic-history/entities/TopicHistory';
import moment from 'moment';

async function emailTopicHistoryExample() {
  try {
    console.log('🚀 Starting Email Topic History Example...\n');

    // Create email sender
    const emailSender = EmailSenderFactory.createNodemailerSender();

    // Create a sample topic history
    const topicHistory = new TopicHistory(
      'topic-123',
      'Today I learned about TypeScript decorators and their applications in frameworks like Angular. Decorators are functions that can be attached to classes, methods, properties, and parameters. They provide a way to add metadata and modify behavior. I explored how decorators work with the @Component decorator in Angular and how they help create reusable, maintainable code.',
      'history-456',
      new Date()
    );

    const topicSubject = 'TypeScript Decorators';

    // Example 1: Send email to a specific address
    console.log('📧 Example 1: Sending topic history by email');
    const recipientEmail = 'recipient@example.com'; // Replace with actual email
    
    await emailSender.send({
      email: recipientEmail,
      topicHistory: topicHistory,
      topicSubject: topicSubject
    });

    console.log('✅ Email sent successfully!');
    console.log(`📤 Sent to: ${recipientEmail}`);
    console.log(`📝 Topic: ${topicSubject}`);
    console.log(`🆔 Entry ID: ${topicHistory.id}`);

  } catch (error) {
    console.error('❌ Error sending email:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('EMAIL_USER') || error.message.includes('EMAIL_PASS')) {
        console.log('\n💡 To fix this error:');
        console.log('1. Add your email credentials to global-config.prod.json in the email section');
        console.log('2. Or set the EMAIL_USER and EMAIL_PASS environment variables');
        console.log('3. For Gmail, use an App Password instead of your regular password');
        console.log('4. Make sure 2FA is enabled on your Gmail account');
      }
    }
  }
}

async function emailMultipleTopicHistories() {
  try {
    console.log('\n📧 Example 2: Sending multiple topic histories');

    const emailSender = EmailSenderFactory.createNodemailerSender();
    const recipientEmail = 'recipient@example.com'; // Replace with actual email

    // Create multiple topic histories
    const topicHistories = [
      new TopicHistory(
        'topic-1',
        'Learned about JavaScript Promises and how they handle asynchronous operations. Promises have three states: pending, fulfilled, and rejected. I practiced creating promises and using .then() and .catch() methods.',
        'history-1',
        moment().subtract(2, 'days').toDate()
      ),
      new TopicHistory(
        'topic-2',
        'Explored async/await syntax which makes working with promises much cleaner. The async keyword declares an asynchronous function, and await pauses execution until a promise resolves.',
        'history-2',
        moment().subtract(1, 'day').toDate()
      ),
      new TopicHistory(
        'topic-3',
        'Dived into error handling with try/catch blocks in async functions. This is much more intuitive than chaining .catch() methods on promises.',
        'history-3',
        new Date()
      )
    ];

    const topics = ['JavaScript Promises', 'Async/Await', 'Error Handling'];

    // Send emails for each topic history
    for (let i = 0; i < topicHistories.length; i++) {
      const topicHistory = topicHistories[i];
      const topicSubject = topics[i];

      console.log(`📤 Sending email for: ${topicSubject}`);
      
      await emailSender.send({
        email: recipientEmail,
        topicHistory: topicHistory,
        topicSubject: topicSubject
      });

      console.log(`✅ Email sent for: ${topicSubject}`);
      
      // Add a small delay between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n🎉 All emails sent successfully!');

  } catch (error) {
    console.error('❌ Error sending multiple emails:', error);
  }
}

// Example with custom email configuration
async function emailWithCustomConfig() {
  try {
    console.log('\n🔧 Example 3: Email with custom configuration');
    
    // This example shows how you could create a custom email sender
    // with different configuration if needed
    const emailSender = EmailSenderFactory.createNodemailerSender();
    
    const topicHistory = new TopicHistory(
      'topic-custom',
      'This is a test email with custom configuration to verify the email system is working correctly.',
      'history-custom',
      new Date()
    );

    await emailSender.send({
      email: 'test@example.com',
      topicHistory: topicHistory,
      topicSubject: 'Email System Test'
    });

    console.log('✅ Custom email sent successfully!');

  } catch (error) {
    console.error('❌ Error with custom email:', error);
  }
}

// Export functions for use in other files
export { emailTopicHistoryExample, emailMultipleTopicHistories, emailWithCustomConfig };

// Run example if this file is executed directly
if (require.main === module) {
  emailTopicHistoryExample();
} 