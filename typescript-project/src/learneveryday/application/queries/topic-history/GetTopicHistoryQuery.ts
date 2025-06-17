import { BaseQuery } from '../Query';
import { TopicHistory } from '../../../domain/topic-history/entities/TopicHistory';
import { TopicHistoryRepositoryPort } from '../../../domain/topic-history/ports/TopicHistoryRepositoryPort';
import { TopicHistoryDTO, TopicHistoryDTOMapper } from '../../dto/TopicDTO';

export interface GetTopicHistoryQueryData {
  topicId: string;
}

export class GetTopicHistoryQuery extends BaseQuery<TopicHistoryDTO[]> {
  constructor(
    private readonly data: GetTopicHistoryQueryData,
    private readonly topicHistoryRepository: TopicHistoryRepositoryPort
  ) {
    super();
  }

  async execute(): Promise<TopicHistoryDTO[]> {
    const { topicId } = this.data;
    const topicHistories = await this.topicHistoryRepository.findByTopicId(topicId);
    return topicHistories.map(history => TopicHistoryDTOMapper.toDTO(history));
  }
} 