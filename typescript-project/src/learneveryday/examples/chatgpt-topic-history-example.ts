import { TopicHistoryGeneratorFactory } from '../infrastructure/factories/TopicHistoryGeneratorFactory';
import { TopicHistory } from '../domain/topic-history/entities/TopicHistory';
import moment from 'moment';

async function exampleUsage() {
  try {
    // Create the ChatGPT generator using environment variables
    const generator = TopicHistoryGeneratorFactory.createChatGptGeneratorFromEnv();
    
    // Example topic subject
    const topicSubject = 'TypeScript Advanced Features';
    
    // Example existing history
    const existingHistory: TopicHistory[] = [
      new TopicHistory(
        'topic-1',
        'Learned about TypeScript generics and how they provide type safety while maintaining flexibility. Explored generic functions, interfaces, and classes. The key insight was understanding how generics help create reusable components that work with multiple types.',
        'history-1',
        moment().subtract(2, 'days').toDate()
      ),
      new TopicHistory(
        'topic-1',
        'Dived into TypeScript decorators and their applications in frameworks like Angular. Decorators are functions that can be attached to classes, methods, properties, and parameters. They provide a way to add metadata and modify behavior.',
        'history-2',
        moment().subtract(1, 'day').toDate()
      )
    ];
    
    console.log('Generating new topic history entry...');
    console.log(`Topic: ${topicSubject}`);
    console.log(`Existing entries: ${existingHistory.length}`);
    
    // Generate new content
    const newContent = await generator.generate({
      topicSubject,
      history: existingHistory
    });
    
    console.log('\n=== Generated Content ===');
    console.log(newContent);
    console.log('========================\n');
    
    // Create a new TopicHistory entity with the generated content
    const newHistoryEntry = new TopicHistory('topic-1', newContent);
    console.log('New history entry created:', {
      id: newHistoryEntry.id,
      topicId: newHistoryEntry.topicId,
      createdAt: newHistoryEntry.createdAt,
      contentLength: newHistoryEntry.content.length
    });
    
  } catch (error) {
    console.error('Error generating topic history:', error);
  }
}

// Example with custom API key
async function exampleWithCustomApiKey() {
  try {
    const customApiKey = 'your-openai-api-key-here';
    const generator = TopicHistoryGeneratorFactory.createChatGptGenerator(customApiKey);
    
    const newContent = await generator.generate({
      topicSubject: 'JavaScript Promises and Async/Await',
      history: []
    });
    
    console.log('Generated content for new topic:', newContent);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Export for use in other files
export { exampleUsage, exampleWithCustomApiKey };

// Run example if this file is executed directly
if (require.main === module) {
  exampleUsage();
} 