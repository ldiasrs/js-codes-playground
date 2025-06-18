import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { TaskProcess } from '../../taskprocess/entities/TaskProcess';
import { TaskProcessRunner } from '../../taskprocess/ports/TaskProcessRunner';
import { TaskProcessRepositoryPort } from '../../taskprocess/ports/TaskProcessRepositoryPort';
import { TopicHistory } from '../entities/TopicHistory';
import { TopicRepositoryPort } from '../../topic/ports/TopicRepositoryPort';
import { TopicHistoryRepositoryPort } from '../ports/TopicHistoryRepositoryPort';
import { GenerateTopicHistoryPort } from '../ports/GenerateTopicHistoryPort';
import { TYPES } from '../../../infrastructure/di/types';

@injectable()
export class GenerateTopicHistoryTaskRunner implements TaskProcessRunner {
  constructor(
    @inject(TYPES.TopicRepository) private readonly topicRepository: TopicRepositoryPort,
    @inject(TYPES.TopicHistoryRepository) private readonly topicHistoryRepository: TopicHistoryRepositoryPort,
    @inject(TYPES.GenerateTopicHistoryPort) private readonly generateTopicHistoryPort: GenerateTopicHistoryPort,
    @inject(TYPES.TaskProcessRepository) private readonly taskProcessRepository: TaskProcessRepositoryPort
  ) {}

  /**
   * Executes the topic history generation task
   * @param taskProcess The task process containing the topic ID in entityId
   * @returns Promise<void> Resolves when topic history is generated and saved successfully
   * @throws Error if topic doesn't exist, generation fails, or saving fails
   */
  async execute(taskProcess: TaskProcess): Promise<void> {
    const topicId = taskProcess.entityId;

    // Step 1: Verify topic exists
    const topic = await this.topicRepository.findById(topicId);
    if (!topic) {
      throw new Error(`Topic with ID ${topicId} not found`);
    }

    // Step 2: Get existing history for context
    const existingHistory = await this.topicHistoryRepository.findByTopicId(topicId);

    // Step 3: Generate new topic history content
    const generatedContent = await this.generateTopicHistoryPort.generate({
      topicSubject: topic.subject,
      history: existingHistory
    });

    // Step 4: Create and save the new history entry
    const newHistory = new TopicHistory(topicId, generatedContent);
    const savedHistory = await this.topicHistoryRepository.save(newHistory);

    // Step 5: Create a new TaskProcess for sending the topic history
    const sendTaskProcess = new TaskProcess(
      savedHistory.id, // Use the topic history ID as entityId
      'topic-history-send',
      'pending'
    );

    // Step 6: Save the new task process
    await this.taskProcessRepository.save(sendTaskProcess);

    console.log(`Generated topic history for topic: ${topicId} and created send task: ${sendTaskProcess.id}`);
  }
} 