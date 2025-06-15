import { BaseQuery } from '../Query';
import { Topic } from '../../../domain/entities/Topic';
import { TopicRepositoryPort } from '../../../domain/ports/TopicRepositoryPort';
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
    return topic ? TopicDTOMapper.toDTO(topic) : undefined;
  }
} 