import { TopicHistory } from '../entities/TopicHistory';
import { LoggerPort } from '../../shared/ports/LoggerPort';
import moment from 'moment';

export interface PromptBuilderData {
  topicSubject: string;
  history: TopicHistory[];
}

export class PromptBuilder {
  private maxHistoryEntries;

  constructor(
    private readonly logger: LoggerPort,
    maxHistoryEntries?: number
  ) {
    this.maxHistoryEntries = maxHistoryEntries ?? 5;
  }

  /**
   * Builds a prompt based on the topic subject and history
   * @param data The data containing topic subject and history
   * @returns string The built prompt
   */
  build(data: PromptBuilderData): string {
    const historyContext = this.formatHistoryContext(data.history);

    if (data.topicSubject.includes('#clean-prompt')) {
      if (data.topicSubject.includes('#discard-history')) {
        const prompt = data.topicSubject;
        this.logger.info('Prompt completo construído', { 
          prompt, 
          type: 'clean-prompt-discard-history',
          topicSubject: data.topicSubject
        });
        return prompt;
      }
      const prompt = `Esse é meu histórico anterior:\n\n ${data.topicSubject}`;
      this.logger.info('Prompt completo construído', { 
        prompt, 
        type: 'clean-prompt',
        topicSubject: data.topicSubject
      });
      return prompt;
    }

    const topicSubject = data.topicSubject.replace('#clean-prompt', '').replace('#discard-history', '');
    const prompt = `
        - Eu quero aprender sobre ${topicSubject}, recebendo informações a cada interação.
        - Quero receber a informação em uma lista numerada com 3 itens
        - A informação que já foi processada não deve ser re-envida
        - Quero a informação de maneira bem sucinta 
        - Ao final coloque algumas referencias de livros e links de youtube sobre o assunto

        Esse é meu histórico anterior:\n\n
        ${historyContext}
`;

    this.logger.info('Prompt completo construído', { 
      prompt, 
      type: 'standard',
      topicSubject: data.topicSubject,
      historyEntriesCount: data.history.length
    });
    return prompt;
  }

  private formatHistoryContext(history: TopicHistory[]): string {
    if (history.length === 0) {
      return 'Esse é o primeiro histórico para esse assunto.';
    }

    const sortedHistory = history.sort((a, b) => 
      moment(b.createdAt).valueOf() - moment(a.createdAt).valueOf()
    );

    const recentEntries = sortedHistory.slice(0, this.maxHistoryEntries); // Show last 5 entries
    
    let context = '';
    
    recentEntries.forEach((entry, index) => {
      const date = moment(entry.createdAt).format('MMMM D, YYYY');
      context += `${index + 1}. [${date}] ${entry.content}\n\n`;
    });

    return context;
  }
} 