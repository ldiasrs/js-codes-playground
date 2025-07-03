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
      return `Esse é meu histórico anterior:\n\n ${topicSubject}`
    }
    
    return `
        - Eu quero aprender sobre ${topicSubject}, recebendo informações a cada interação.
        - Quero receber a informação em uma lista numerada com 3 itens
        - A informação que já foi processada não deve ser re-envida
        - Quero a informação de maneira bem sucinta 
        - Ao final coloque algumas referencias de livros e links de youtube sobre o assunto

        Esse é meu histórico anterior:\n\n
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