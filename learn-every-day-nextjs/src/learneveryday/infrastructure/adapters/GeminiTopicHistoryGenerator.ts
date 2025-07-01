import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { GenerateTopicHistoryPort, GenerateTopicHistoryPortData } from '../../domain/topic-history/ports/GenerateTopicHistoryPort';
import { TopicHistory } from '../../domain/topic-history/entities/TopicHistory';
import { LoggerPort } from '../../domain/shared/ports/LoggerPort';
import { GeminiConfiguration } from '../config/gemini.config';
import moment from 'moment';

export class GeminiTopicHistoryGenerator implements GenerateTopicHistoryPort {
  private readonly genAI: GoogleGenerativeAI;
  private readonly model: GenerativeModel;
  private readonly config: GeminiConfiguration;

  constructor(private readonly logger: LoggerPort) {
    this.config = GeminiConfiguration.getInstance();
    this.genAI = new GoogleGenerativeAI(this.config.getApiKey());
    this.model = this.genAI.getGenerativeModel({ 
      model: this.config.getModel(),
      generationConfig: {
        maxOutputTokens: this.config.getMaxTokens(),
        temperature: this.config.getTemperature(),
      },
    });
  }

  async generate(data: GenerateTopicHistoryPortData): Promise<string> {
    try {
      this.logger.info('Generating topic history using Gemini', { topicSubject: data.topicSubject });

      const prompt = this.buildPrompt(data.topicSubject, data.history);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const generatedContent = response.text();
      
      if (!generatedContent) {
        throw new Error('No content generated from Gemini');
      }

      this.logger.info('Topic history generated successfully', { 
        topicSubject: data.topicSubject, 
        contentLength: generatedContent.length 
      });

      return generatedContent.trim();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Error generating topic history with Gemini', error instanceof Error ? error : new Error(errorMessage), { 
        topicSubject: data.topicSubject, 
        error: errorMessage
      });
      throw new Error(`Failed to generate topic history: ${errorMessage}`);
    }
  }

  private buildPrompt(topicSubject: string, history: TopicHistory[]): string {
    const historyContext = this.formatHistoryContext(history);

    if (topicSubject.includes('#clean-prompt')) {
      if (topicSubject.includes('#discard-history')) {
        return topicSubject;
      }
      return `topicSubject \n\n This is what i know about the topic:\n ${topicSubject}`
    }
    
    return `
        You will act like a teacher that is teaching a student about the topic: "${topicSubject}".
        - Your goal is understand the need of the topic and provide several continue informations
        - This is one of the informations that you will provide
        - Right in bullet points
        - Be concise and to the point max 3 bullet points
        - Must be in Brazilian Portuguese
        - The examples are very important so you should add practical examples
        - In the end reference sources where more information can be found
        - Format the content to be sent by email

        Below are the previous learning entries for this topic, consider them as context to generate a new learning entry.
        ${historyContext}
`;
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