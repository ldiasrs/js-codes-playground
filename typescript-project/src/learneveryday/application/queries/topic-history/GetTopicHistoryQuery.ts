import { BaseQuery } from '../Query';
import { TopicHistory } from '../../../domain/entities/TopicHistory';
import { TopicHistoryRepositoryPort } from '../../../domain/ports/TopicHistoryRepositoryPort';
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
    const history = await this.topicHistoryRepository.findByTopicId(topicId);
    return history.map(h => TopicHistoryDTOMapper.toDTO(h));
  }
} 