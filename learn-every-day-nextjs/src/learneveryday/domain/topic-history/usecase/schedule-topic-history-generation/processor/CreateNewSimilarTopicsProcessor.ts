import { LoggerPort } from "@/learneveryday/domain/shared";
import { AIPromptExecutorPort } from "@/learneveryday/domain/topic-history/ports/AIPromptExecutorPort";
import { Topic } from "@/learneveryday/domain/topic/entities/Topic";
import { TopicRepositoryPort } from "@/learneveryday/domain/topic/ports/TopicRepositoryPort";
import { CustomerRepositoryPort } from "@/learneveryday/domain/customer/ports/CustomerRepositoryPort";
import { AddTopicFeature } from "@/learneveryday/domain/topic/usecase/AddTopicFeature";
import { DeleteTopicFeature } from "@/learneveryday/domain/topic/usecase/DeleteTopicFeature";
import { DomainError } from "@/learneveryday/domain/shared";

/**
 * Creates new topics similar to the user's interests using AI suggestions.
 * Steps:
 * 1) Ask AI for suggested topics using a fixed prompt
 * 2) Parse the response into subjects
 * 3) Validate against tier limits and duplicates
 * 4) Save up to the requested amount (no task scheduling here)
 */
export class CreateNewSimilarTopicsProcessor {
  private static readonly SUGGESTIONS_COUNT = 3;

  constructor(
    private readonly aiPromptExecutor: AIPromptExecutorPort,
    private readonly topicRepository: TopicRepositoryPort,
    private readonly customerRepository: CustomerRepositoryPort,
    private readonly addTopicFeature: AddTopicFeature,
    private readonly deleteTopicFeature: DeleteTopicFeature,
    private readonly logger: LoggerPort
  ) {}

  async execute(customerId: string, maxToCreate: number): Promise<Topic[]> {
    if (!(await this.ensureCustomerExists(customerId))) {
      return [];
    }
    if (maxToCreate <= 0) {
      return [];
    }
    const toCreate = maxToCreate;
    const uniqueSubjects = await this.getUniqueNewSubjects(customerId, toCreate);
    if (uniqueSubjects.length === 0) {
      return [];
    }
    return await this.createTopicsWithLimit(customerId, uniqueSubjects, toCreate);
  }

  private async ensureCustomerExists(customerId: string): Promise<boolean> {
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      this.logger.warn("Cannot create similar topics: customer not found", { customerId });
      return false;
    }
    return true;
  }

  private async getUniqueNewSubjects(customerId: string, toCreate: number): Promise<string[]> {
    const existing = await this.getExistingSubjects(customerId);
    const userSubjects = Array.from(existing.values())
      .map(s => s.trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
    const aiResponse = await this.getSuggestedSubjects(customerId, userSubjects);
    const suggestedSubjects = this.parseSubjectsFromAiResponse(aiResponse);
    if (suggestedSubjects.length === 0) {
      this.logger.warn("AI returned no subjects to create", { customerId });
    }
    return this.filterUniqueNonExistingSubjects(suggestedSubjects, existing, toCreate);
  }

  private async getSuggestedSubjects(customerId: string, userSubjects: string[]): Promise<string> {
    const prompt = this.buildSuggestionsPrompt(userSubjects);
    const aiResponse = await this.aiPromptExecutor.execute(prompt, customerId);
    return aiResponse;
  }

  private async getExistingSubjects(customerId: string): Promise<Set<string>> {
    const existingTopics = await this.topicRepository.findByCustomerId(customerId);
    return new Set<string>(existingTopics.map(t => t.subject.trim().toLowerCase()));
  }

  private filterUniqueNonExistingSubjects(suggested: string[], existing: Set<string>, limit: number): string[] {
    const normalizedSeen = new Set<string>();
    const result: string[] = [];
    for (const raw of suggested) {
      const subject = raw.trim();
      if (!subject) continue;
      const normalized = subject.toLowerCase();
      if (normalizedSeen.has(normalized)) continue;
      if (existing.has(normalized)) continue;
      normalizedSeen.add(normalized);
      result.push(subject);
      if (result.length >= limit) break;
    }
    if (result.length === 0) {
      this.logger.info("No unique subjects to create after filtering duplicates and limits");
    }
    return result;
  }

  private async createTopicsWithLimit(customerId: string, subjects: string[], toCreate: number): Promise<Topic[]> {
    const saved: Topic[] = [];
    for (const subject of subjects) {
      if (saved.length >= toCreate) break;
      const created = await this.tryCreateTopic(customerId, subject);
      if (created) saved.push(created);
    }
    return saved;
  }

  private async tryCreateTopic(customerId: string, subject: string): Promise<Topic | undefined> {
    try {
      const created = await this.addTopicFeature.execute({ customerId, subject });
      this.logger.info("Created new topic from AI suggestion", { customerId, topicId: created.id, subject });
      return created;
    } catch (error) {
      const code = this.getErrorCode(error);
      if (code === DomainError.TOPIC_LIMIT_REACHED) {
        return await this.handleTierLimitAndRetry(customerId, subject);
      }
      if (code === DomainError.TOPIC_ALREADY_EXISTS) {
        this.logger.info("Suggested subject already exists, skipping", { customerId, subject });
        return undefined;
      }
      this.logger.error(
        `Failed to create suggested topic via AddTopicFeature: ${subject}`,
        error instanceof Error ? error : new Error(String(error)),
        { customerId }
      );
      return undefined;
    }
  }

  private async handleTierLimitAndRetry(customerId: string, subject: string): Promise<Topic | undefined> {
    try {
      const oldest = await this.findOldestTopic(customerId);
      if (!oldest) {
        this.logger.warn("Tier limit reached but no topic found to delete", { customerId });
        return undefined;
      }
      await this.deleteTopicFeature.execute({ id: oldest.id });
      this.logger.info("Deleted oldest topic to free slot", { customerId, deletedTopicId: oldest.id, deletedSubject: oldest.subject });
      const createdAfterDelete = await this.addTopicFeature.execute({ customerId, subject });
      this.logger.info("Created topic after freeing slot", { customerId, topicId: createdAfterDelete.id, subject });
      return createdAfterDelete;
    } catch (deleteOrRetryError) {
      this.logger.error(
        `Failed while handling tier limit for subject: ${subject}`,
        deleteOrRetryError instanceof Error ? deleteOrRetryError : new Error(String(deleteOrRetryError)),
        { customerId }
      );
      return undefined;
    }
  }

  private async findOldestTopic(customerId: string): Promise<Topic | undefined> {
    const topics = await this.topicRepository.findByCustomerId(customerId);
    if (topics.length === 0) return undefined;
    return topics.reduce((oldest, t) => (t.dateCreated < oldest.dateCreated ? t : oldest), topics[0]);
  }
 
  private getErrorCode(error: unknown): string | undefined {
    const anyErr = error as { code?: unknown } | undefined;
    const code = anyErr && typeof anyErr.code === 'string' ? anyErr.code : undefined;
    return code;
  }
 
  private parseSubjectsFromAiResponse(response: string): string[] {
    const lines = response
      .split(/\r?\n/) // split lines
      .map(l => l.trim())
      .filter(l => l.length > 0);

    const subjects = lines.map(line => {
      // Remove bullets or numbering like: "1. Foo", "- Bar", "* Baz)" etc
      const cleaned = line
        .replace(/^\d+[\).\-\s]*/, "")
        .replace(/^[\-*•]\s*/, "")
        .replace(/^"|"$/g, "")
        .trim();
      return cleaned;
    });

    // If AI returned a single line separated by commas, split it
    if (subjects.length === 1 && subjects[0].includes(",")) {
      return subjects[0]
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);
    }

    return subjects;
  }

  private buildSuggestionsPrompt(userSubjects: string[]): string {
    const subjectsList = userSubjects.length > 0 ? userSubjects.join(', ') : 'seus tópicos atuais';
    const count = CreateNewSimilarTopicsProcessor.SUGGESTIONS_COUNT;
    return (
      `Me dê ${count} sugestões de tópicos de estudo que estejam na interseção e/ou que sejam altamente relevantes considerando TODOS estes tópicos do usuário: ${subjectsList}. ` +
      `Os tópicos devem ser bem aceitos na comunidade e ter relevância direta para alguém que já estudou os tópicos acima. ` +
      `A saída deve ser uma lista simples com os nomes dos tópicos, sem descrições.`
    );
  }
}


