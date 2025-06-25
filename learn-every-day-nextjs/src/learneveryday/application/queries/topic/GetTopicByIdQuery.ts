import { BaseQuery } from '../Query';
import { Topic } from '../../../domain/topic/entities/Topic';
import { TopicRepositoryPort } from '../../../domain/topic/ports/TopicRepositoryPort';
import { TopicDTO, TopicDTOMapper } from '../../dto/TopicDTO';

export interface GetTopicByIdQueryData {
  topicId: string;
}

export class GetTopicByIdQuery extends BaseQuery<TopicDTO | undefined> {
  constructor(
    private readonly data: GetTopicByIdQueryData,
    private readonly topicRepository: TopicRepositoryPort
  ) {
    super();
  }

  async execute(): Promise<TopicDTO | undefined> {
    const { topicId } = this.data;
    const topic = await this.topicRepository.findById(topicId);
    
    if (!topic) {
      return undefined;
    }
    
    return TopicDTOMapper.toDTO(topic);
  }
} 