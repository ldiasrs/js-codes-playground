import { BaseQuery } from '../Query';
import { TopicRepositoryPort } from '../../../domain/topic/ports/TopicRepositoryPort';
import { TopicDTO, TopicDTOMapper } from '../../dto/TopicDTO';

export interface GetTopicByIdQueryData {
  topicId: string;
}

export class GetTopicByIdQuery extends BaseQuery<TopicDTO | undefined, GetTopicByIdQueryData> {
  constructor(
    private readonly topicRepository: TopicRepositoryPort
  ) {
    super();
  }

  async execute(data: GetTopicByIdQueryData): Promise<TopicDTO | undefined> {
    const { topicId } = data;
    const topic = await this.topicRepository.findById(topicId);
    
    if (!topic) {
      return undefined;
    }
    
    return TopicDTOMapper.toDTO(topic);
  }
} 