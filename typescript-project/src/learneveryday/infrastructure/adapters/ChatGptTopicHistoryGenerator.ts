import OpenAI from 'openai';
import { GenerateTopicHistoryPort, GenerateTopicHistoryPortData } from '../../domain/topic-history/ports/GenerateTopicHistoryPort';
import { TopicHistory } from '../../domain/topic-history/entities/TopicHistory';
import { OpenAIConfiguration } from '../config/openai.config';
import moment from 'moment';

export class ChatGptTopicHistoryGenerator implements GenerateTopicHistoryPort {
  private readonly openai: OpenAI;
  private readonly config: OpenAIConfiguration;

  constructor(apiKey?: string) {
    this.config = OpenAIConfiguration.getInstance();
    this.openai = new OpenAI({
      apiKey: apiKey || this.config.getApiKey(),
    });
  }

  async generate(data: GenerateTopicHistoryPortData): Promise<string> {
    try {
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
        temperature: this.config.getTemperature(),
      });

      const generatedContent = response.choices[0]?.message?.content;
      
      if (!generatedContent) {
        throw new Error('No content generated from ChatGPT');
      }

      return generatedContent.trim();
    } catch (error) {
      throw new Error(`Failed to generate topic history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildPrompt(topicSubject: string, history: TopicHistory[]): string {
    const historyContext = this.formatHistoryContext(history);
    
    return `Generate a new learning history entry for the topic: "${topicSubject}"

${historyContext}

Please create a new learning entry that:
1. Is engaging and informative
2. Builds upon the previous learning experiences
3. Provides new insights or perspectives
4. Is written in a conversational, learning-focused tone
5. Includes practical takeaways or applications
6. Is approximately 150-300 words

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