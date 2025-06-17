import { NedbCustomerRepository } from '../infrastructure/adapters/NedbCustomerRepository';
import { NedbTopicHistoryRepository } from '../infrastructure/adapters/NedbTopicHistoryRepository';
import { NedbTopicRepository } from '../infrastructure/adapters/NedbTopicRepository';
import { TopicHistoryGeneratorFactory } from '../infrastructure/factories/TopicHistoryGeneratorFactory';
import { EmailSenderFactory } from '../infrastructure/factories/EmailSenderFactory';

import { GenerateAndEmailTopicHistoryCommand, GenerateAndEmailTopicHistoryCommandData } from '../application/commands/topic-history/GenerateAndEmailTopicHistoryCommand';
import { GenerateAndEmailTopicHistoryFeature } from '../domain/topic-history/features/GenerateAndEmailTopicHistoryFeature';
import { GenerateTopicHistoryFeature } from '../domain/topic-history/features/GenerateTopicHistoryFeature';

import { TopicHistoryDTO, TopicHistoryDTOMapper } from '../application/dto/TopicDTO';

async function generateAndEmailExample() {
  try {
    console.log('🚀 Starting Generate and Email Topic History Example...\n');

    // Initialize repositories
    const customerRepository = new NedbCustomerRepository('./data');
    const topicRepository = new NedbTopicRepository('./data');
    const topicHistoryRepository = new NedbTopicHistoryRepository('./data');

    // Initialize ports
    const generateTopicHistoryPort = TopicHistoryGeneratorFactory.createChatGptGeneratorFromEnv();
    const sendTopicHistoryByEmailPort = EmailSenderFactory.createNodemailerSender();

    // Initialize features
    const generateTopicHistoryFeature = new GenerateTopicHistoryFeature(
      topicRepository,
      topicHistoryRepository,
      generateTopicHistoryPort
    );

    const generateAndEmailTopicHistoryFeature = new GenerateAndEmailTopicHistoryFeature(
      generateTopicHistoryFeature,
      topicRepository,
      sendTopicHistoryByEmailPort
    );

    // Get all topics to choose from
    const allTopics = await topicRepository.findAll();
    
    if (allTopics.length === 0) {
      console.log('❌ No topics found. Please create some topics first.');
      return;
    }

    console.log('📚 Available topics:');
    allTopics.forEach((topic, index) => {
      console.log(`${index + 1}. ${topic.subject} (ID: ${topic.id})`);
    });

    // Use the first topic for demonstration
    const selectedTopic = allTopics[0];
    console.log(`\n🎯 Selected topic: ${selectedTopic.subject} (ID: ${selectedTopic.id})`);

    // Get existing history for this topic
    const existingHistory = await topicHistoryRepository.findByTopicId(selectedTopic.id);
    console.log(`📖 Existing history entries: ${existingHistory.length}`);

    // Set recipient email (replace with actual email)
    const recipientEmail = 'ldias.rs@gmail.com'; // Replace with actual email address

    // Create command data
    const commandData: GenerateAndEmailTopicHistoryCommandData = {
      topicId: selectedTopic.id,
      recipientEmail: recipientEmail
    };

    // Create and execute command
    const command = new GenerateAndEmailTopicHistoryCommand(commandData, generateAndEmailTopicHistoryFeature);
    
    console.log('\n🤖 Generating new topic history with ChatGPT...');
    console.log(`📧 Will send to: ${recipientEmail}`);
    
    const result: TopicHistoryDTO = await command.execute();

    console.log('\n✅ Successfully generated and emailed new topic history!');
    console.log('\n📄 Generated Content:');
    console.log('='.repeat(50));
    console.log(result.content);
    console.log('='.repeat(50));
    
    console.log('\n📊 Result Details:');
    console.log(`- ID: ${result.id}`);
    console.log(`- Topic ID: ${result.topicId}`);
    console.log(`- Created At: ${result.createdAt}`);
    console.log(`- Content Length: ${result.content.length} characters`);
    console.log(`- Email Sent To: ${recipientEmail}`);

    // Show updated history count
    const updatedHistory = await topicHistoryRepository.findByTopicId(selectedTopic.id);
    console.log(`\n📈 Total history entries for this topic: ${updatedHistory.length}`);

  } catch (error) {
    console.error('❌ Error generating and emailing topic history:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('OPENAI_API_KEY')) {
        console.log('\n💡 To fix OpenAI error:');
        console.log('1. Add your OpenAI API key to global-config.prod.json in the chatgpt_topic_history section');
        console.log('2. Or set the OPENAI_API_KEY environment variable');
      }
      
      if (error.message.includes('EMAIL_USER') || error.message.includes('EMAIL_PASS')) {
        console.log('\n💡 To fix email error:');
        console.log('1. Add your email credentials to global-config.prod.json in the email section');
        console.log('2. Or set the EMAIL_USER and EMAIL_PASS environment variables');
        console.log('3. For Gmail, use an App Password instead of your regular password');
      }
    }
  }
}

// Example with custom configuration
async function generateAndEmailWithCustomConfig() {
  try {
    console.log('\n🔧 Generate and Email with Custom Configuration...');

    const customerRepository = new NedbCustomerRepository('./data');
    const topicRepository = new NedbTopicRepository('./data');
    const topicHistoryRepository = new NedbTopicHistoryRepository('./data');

    // Use custom API key for ChatGPT
    const customApiKey = 'your-openai-api-key-here';
    const generateTopicHistoryPort = TopicHistoryGeneratorFactory.createChatGptGenerator(customApiKey);
    const sendTopicHistoryByEmailPort = EmailSenderFactory.createNodemailerSender();

    const generateTopicHistoryFeature = new GenerateTopicHistoryFeature(
      topicRepository,
      topicHistoryRepository,
      generateTopicHistoryPort
    );

    const generateAndEmailTopicHistoryFeature = new GenerateAndEmailTopicHistoryFeature(
      generateTopicHistoryFeature,
      topicRepository,
      sendTopicHistoryByEmailPort
    );

    const allTopics = await topicRepository.findAll();
    if (allTopics.length === 0) {
      console.log('❌ No topics found.');
      return;
    }

    const commandData: GenerateAndEmailTopicHistoryCommandData = {
      topicId: allTopics[0].id,
      recipientEmail: 'custom@example.com'
    };

    const command = new GenerateAndEmailTopicHistoryCommand(commandData, generateAndEmailTopicHistoryFeature);
    const result = await command.execute();

    console.log('✅ Generated and emailed with custom config:', result.content.substring(0, 100) + '...');

  } catch (error) {
    console.error('❌ Error with custom config:', error);
  }
}

// Example for multiple topics
async function generateAndEmailMultipleTopics() {
  try {
    console.log('\n🌟 Generate and Email for Multiple Topics...');

    const customerRepository = new NedbCustomerRepository('./data');
    const topicRepository = new NedbTopicRepository('./data');
    const topicHistoryRepository = new NedbTopicHistoryRepository('./data');

    const generateTopicHistoryPort = TopicHistoryGeneratorFactory.createChatGptGeneratorFromEnv();
    const sendTopicHistoryByEmailPort = EmailSenderFactory.createNodemailerSender();

    const generateTopicHistoryFeature = new GenerateTopicHistoryFeature(
      topicRepository,
      topicHistoryRepository,
      generateTopicHistoryPort
    );

    const generateAndEmailTopicHistoryFeature = new GenerateAndEmailTopicHistoryFeature(
      generateTopicHistoryFeature,
      topicRepository,
      sendTopicHistoryByEmailPort
    );

    const allTopics = await topicRepository.findAll();
    const recipientEmail = 'recipient@example.com'; // Replace with actual email

    console.log(`📧 Sending emails to: ${recipientEmail}`);

    for (const topic of allTopics) {
      try {
        console.log(`\n📤 Processing topic: ${topic.subject}`);
        
        const commandData: GenerateAndEmailTopicHistoryCommandData = {
          topicId: topic.id,
          recipientEmail: recipientEmail
        };

        const command = new GenerateAndEmailTopicHistoryCommand(commandData, generateAndEmailTopicHistoryFeature);
        const result = await command.execute();

        console.log(`✅ Generated and emailed for: ${topic.subject}`);
        console.log(`📝 Content preview: ${result.content.substring(0, 80)}...`);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`❌ Error processing topic ${topic.subject}:`, error);
      }
    }

    console.log('\n🎉 Completed processing all topics!');

  } catch (error) {
    console.error('❌ Error processing multiple topics:', error);
  }
}

// Export functions for use in other files
export { generateAndEmailExample, generateAndEmailWithCustomConfig, generateAndEmailMultipleTopics };

// Run example if this file is executed directly
if (require.main === module) {
  generateAndEmailExample();
} 