import { BaseQuery } from '../Query';
import { TopicRepositoryPort, TopicSearchCriteria } from '../../../domain/topic/ports/TopicRepositoryPort';
import { TopicDTO, TopicDTOMapper } from '../../dto/TopicDTO';

export interface SearchTopicsQueryData {
  criteria: TopicSearchCriteria;
}

export class SearchTopicsQuery extends BaseQuery<TopicDTO[], SearchTopicsQueryData> {
  constructor(
    private readonly topicRepository: TopicRepositoryPort
  ) {
    super();
  }

  async execute(data: SearchTopicsQueryData): Promise<TopicDTO[]> {
    const { criteria } = data;
    const topics = await this.topicRepository.search(criteria);
    return topics.map(topic => TopicDTOMapper.toDTO(topic));
  }
} 