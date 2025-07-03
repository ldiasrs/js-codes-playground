import { TopicHistory } from '../entities/TopicHistory';
import moment from 'moment';

export interface PromptBuilderData {
  topicSubject: string;
  history: TopicHistory[];
}

export class PromptBuilder {
  /**
   * Builds a prompt based on the topic subject and history
   * @param data The data containing topic subject and history
   * @returns string The built prompt
   */
  build(data: PromptBuilderData): string {
    const historyContext = this.formatHistoryContext(data.history);

    if (data.topicSubject.includes('#clean-prompt')) {
      if (data.topicSubject.includes('#discard-history')) {
        return data.topicSubject;
      }
      return `Esse é meu histórico anterior:\n\n ${data.topicSubject}`
    }
    
    return `
        - Eu quero aprender sobre ${data.topicSubject}, recebendo informações a cada interação.
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