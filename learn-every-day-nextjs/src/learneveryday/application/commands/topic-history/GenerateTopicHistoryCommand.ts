import { BaseCommand } from '../Command';
import { TopicHistoryDTO, TopicHistoryDTOMapper } from '../../dto/TopicDTO';
import { GenerateTopicHistoryTaskRunner } from '../../../domain/topic-history/usecase/GenerateTopicHistoryTaskRunner';
import { TopicHistoryRepositoryPort } from '../../../domain/topic-history/ports/TopicHistoryRepositoryPort';
import { TopicRepositoryPort } from '../../../domain/topic/ports/TopicRepositoryPort';
import { TaskProcess } from '../../../domain/taskprocess/entities/TaskProcess';

export interface GenerateTopicHistoryCommandData {
  topicId: string;
}

export class GenerateTopicHistoryCommand extends BaseCommand<TopicHistoryDTO, GenerateTopicHistoryCommandData> {
  constructor(
    private readonly generateTopicHistoryTaskRunner: GenerateTopicHistoryTaskRunner,
    private readonly topicHistoryRepository: TopicHistoryRepositoryPort,
    private readonly topicRepository: TopicRepositoryPort
  ) {
    super();
  }

  async execute(data: GenerateTopicHistoryCommandData): Promise<TopicHistoryDTO> {
    // Get the topic to find the customerId
    const topic = await this.topicRepository.findById(data.topicId);
    if (!topic) {
      throw new Error(`Topic with ID ${data.topicId} not found`);
    }

    // Create a TaskProcess instance for the runner
    const taskProcess = new TaskProcess(
      data.topicId,
      topic.customerId,
      TaskProcess.GENERATE_TOPIC_HISTORY,
      'running'
    );

    // Execute the task runner
    await this.generateTopicHistoryTaskRunner.execute(taskProcess);

    // Get the latest generated topic history
    const topicHistories = await this.topicHistoryRepository.findByTopicId(data.topicId);
    const latestTopicHistory = topicHistories.sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    )[0];

    if (!latestTopicHistory) {
      throw new Error(`Failed to generate topic history for topic ID ${data.topicId}`);
    }

    // Convert result to DTO
    return TopicHistoryDTOMapper.toDTO(latestTopicHistory);
  }
} 