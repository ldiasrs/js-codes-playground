import OpenAI from 'openai';
import { GenerateTopicHistoryPort, GenerateTopicHistoryPortData } from '../../domain/topic-history/ports/GenerateTopicHistoryPort';
import { TopicHistory } from '../../domain/topic-history/entities/TopicHistory';
import { LoggerPort } from '../../domain/shared/ports/LoggerPort';
import { OpenAIConfiguration } from '../config/openai.config';
import moment from 'moment';

export class ChatGptTopicHistoryGenerator implements GenerateTopicHistoryPort {
  private readonly openai: OpenAI;
  private readonly config: OpenAIConfiguration;

  constructor(private readonly logger: LoggerPort) {
    this.config = OpenAIConfiguration.getInstance();
    this.openai = new OpenAI({
      apiKey: this.config.getApiKey(),
    });
  }

  async generate(data: GenerateTopicHistoryPortData): Promise<string> {
    try {
      this.logger.info('Generating topic history using ChatGPT', { topicSubject: data.topicSubject });

      const prompt = this.buildPrompt(data.topicSubject, data.history);
      
      const response = await this.openai.chat.completions.create({
        model: this.config.getModel(),
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates learning history entries. You should create engaging, informative content that builds upon previous learning experiences.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.config.getMaxTokens(),
        temperature: 0.7
      });

      const generatedContent = response.choices[0]?.message?.content;
      
      if (!generatedContent) {
        throw new Error('No content generated from ChatGPT');
      }

      this.logger.info('Topic history generated successfully', { 
        topicSubject: data.topicSubject, 
        contentLength: generatedContent.length 
      });

      return generatedContent.trim();
    } catch (error) {
      this.logger.error('Error generating topic history with ChatGPT', { 
        topicSubject: data.topicSubject, 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw new Error(`Failed to generate topic history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildPrompt(topicSubject: string, history: TopicHistory[]): string {
    const historyContext = this.formatHistoryContext(history);
    
    return `Generate a new learning history entry for the topic: "${topicSubject}"

${historyContext}

Please create a new learning entry that:
- Is engaging and informative
- Builds upon the previous learning experiences
- Provides new insights or perspectives
- Is written in numbered list
- Includes practical takeaways or applications
- Is approximately 150-300 words
- Must be in Brazilian Portuguese
- The text must pass a joy and a message of learning
- Add some practical examples
- In the end add references links to the content
- Format the content to be sent by email

Generate the content now:`;
  }

  private formatHistoryContext(history: TopicHistory[]): string {
    if (history.length === 0) {
      return 'This is the first learning entry for this topic.';
    }

    const sortedHistory = history.sort((a, b) => 
      moment(b.createdAt).valueOf() - moment(a.createdAt).valueOf()
    );

    const recentEntries = sortedHistory.slice(0, 5); // Show last 5 entries
    
    let context = `Previous learning entries for this topic:\n\n`;
    
    recentEntries.forEach((entry, index) => {
      const date = moment(entry.createdAt).format('MMMM D, YYYY');
      context += `${index + 1}. [${date}] ${entry.content}\n\n`;
    });

    if (history.length > 5) {
      context += `... and ${history.length - 5} more previous entries.\n\n`;
    }

    return context;
  }
} 