import { TopicHistory } from '../entities/TopicHistory';
import { LoggerPort } from '../../shared/ports/LoggerPort';
import moment from 'moment';

export interface PromptBuilderData {
  topicSubject: string;
  history: TopicHistory[];
  customerId?: string;
}

export interface MainTopicsPromptData {
  topicSubject: string;
  history: TopicHistory[];
  customerId?: string;
}

export interface DetailedContentPromptData {
  topicSubject: string;
  mainTopics: string;
  history: TopicHistory[];
  customerId?: string;
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
          customerId: data.customerId || "not-provided",
          prompt, 
          type: 'clean-prompt-discard-history',
          topicSubject: data.topicSubject
        });
        return prompt;
      }
      const prompt = `Esse é meu histórico anterior:\n\n ${data.topicSubject}`;
      this.logger.info('Prompt completo construído', { 
        customerId: data.customerId || "not-provided",
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
      customerId: data.customerId || "not-provided",
      prompt, 
      type: 'standard',
      topicSubject: data.topicSubject,
      historyEntriesCount: data.history.length
    });
    return prompt;
  }

  /**
   * Builds a prompt to get the 9 main content topics
   * @param data The data containing topic subject and history
   * @returns string The built prompt for main topics
   */
  buildMainTopicsPrompt(data: MainTopicsPromptData): string {
    const historyContext = this.formatHistoryForMainTopics(data.history);
    
    const prompt = `
Preciso que você identifique os 9 principais conteúdos/subtópicos sobre "${data.topicSubject}" que ainda não foram abordados.

${historyContext}

Retorne APENAS uma lista numerada de 1 a 9 com os principais conteúdos, sem explicações adicionais:

1. [Conteúdo 1]
2. [Conteúdo 2]
3. [Conteúdo 3]
4. [Conteúdo 4]
5. [Conteúdo 5]
6. [Conteúdo 6]
7. [Conteúdo 7]
8. [Conteúdo 8]
9. [Conteúdo 9]

Importante: Não repita conteúdos que já foram abordados no histórico anterior.
`;

    this.logger.info('Prompt para tópicos principais construído', { 
      customerId: data.customerId || "not-provided",
      type: 'main-topics',
      topicSubject: data.topicSubject,
      historyEntriesCount: data.history.length
    });

    return prompt;
  }

  /**
   * Builds a detailed content prompt using the main topics and ensuring no duplication
   * @param data The data containing topic subject, main topics and history
   * @returns string The built prompt for detailed content
   */
  buildDetailedContentPrompt(data: DetailedContentPromptData): string {
    const historyContext = this.formatHistoryContext(data.history);
    
    const prompt = `
Com base nos 9 principais conteúdos identificados sobre "${data.topicSubject}":

${data.mainTopics}

Agora quero que você gere conteúdo educativo seguindo estas diretrizes:

- Escolha 3 conteúdos da lista acima que ainda não foram detalhados
- Para cada conteúdo escolhido, forneça explicação clara e sucinta
- Use formato de lista numerada
- Inclua exemplos práticos quando aplicável
- A informação que já foi processada não deve ser re-enviada
- Ao final, inclua algumas referências de livros e links do YouTube sobre o assunto

${historyContext}

Formato esperado:
1. [Conteúdo escolhido]: [Explicação detalhada]
2. [Conteúdo escolhido]: [Explicação detalhada]  
3. [Conteúdo escolhido]: [Explicação detalhada]

Referências:
- Livros: [lista de livros]
- YouTube: [lista de links/canais]
`;

    this.logger.info('Prompt para conteúdo detalhado construído', { 
      customerId: data.customerId || "not-provided",
      type: 'detailed-content',
      topicSubject: data.topicSubject,
      historyEntriesCount: data.history.length,
      mainTopicsLength: data.mainTopics.length
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

  /**
   * Formats existing history for the main topics prompt (summarized version)
   * @param history The existing topic history
   * @returns string Formatted history context for main topics
   */
  private formatHistoryForMainTopics(history: TopicHistory[]): string {
    if (history.length === 0) {
      return 'Este é o primeiro conteúdo para este tópico.';
    }

    let context = 'Conteúdos já abordados anteriormente:\n\n';
    
    history.forEach((entry, index) => {
      const shortContent = this.extractMainPoints(entry.content);
      context += `${index + 1}. ${shortContent}\n`;
    });

    return context;
  }

  /**
   * Extracts main points from content for summary
   * @param content The full content
   * @returns string Summarized main points
   */
  private extractMainPoints(content: string): string {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      if (firstLine.match(/^\d+\./)) {
        return firstLine;
      }
      const firstSentence = firstLine.split('.')[0];
      return firstSentence.length > 100 ? firstSentence.substring(0, 100) + '...' : firstSentence;
    }
    return content.length > 100 ? content.substring(0, 100) + '...' : content;
  }
} 