import { BaseQuery } from '../Query';
import { Topic } from '../../../domain/topic/entities/Topic';
import { TopicRepositoryPort, TopicSearchCriteria } from '../../../domain/topic/ports/TopicRepositoryPort';
import { TopicDTO, TopicDTOMapper } from '../../dto/TopicDTO';

export interface SearchTopicsQueryData {
  criteria: TopicSearchCriteria;
}

export class SearchTopicsQuery extends BaseQuery<TopicDTO[]> {
  constructor(
    private readonly data: SearchTopicsQueryData,
    private readonly topicRepository: TopicRepositoryPort
  ) {
    super();
  }

  async execute(): Promise<TopicDTO[]> {
    const { criteria } = this.data;
    const topics = await this.topicRepository.search(criteria);
    return topics.map(topic => TopicDTOMapper.toDTO(topic));
  }
} 