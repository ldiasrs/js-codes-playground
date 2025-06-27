import { BaseQuery } from '../Query';
import { TopicRepositoryPort } from '../../../domain/topic/ports/TopicRepositoryPort';
import { TopicDTO, TopicDTOMapper } from '../../dto/TopicDTO';

export interface GetAllTopicsQueryData {
  customerId: string;
}

export class GetAllTopicsQuery extends BaseQuery<TopicDTO[]> {
  constructor(
    private readonly data: GetAllTopicsQueryData,
    private readonly topicRepository: TopicRepositoryPort
  ) {
    super();
  }

  async execute(): Promise<TopicDTO[]> {
    const { customerId } = this.data;
    const topics = await this.topicRepository.findByCustomerId(customerId);
    return topics.map(topic => TopicDTOMapper.toDTO(topic));
  }
} 