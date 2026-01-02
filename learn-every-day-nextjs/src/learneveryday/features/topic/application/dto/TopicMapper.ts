import { Topic } from '../../domain/Topic';
import { TopicDTO } from './TopicDTO';

export class TopicMapper {
  static toDTO(topic: Topic): TopicDTO {
    return {
      id: topic.id,
      customerId: topic.customerId,
      subject: topic.subject,
      dateCreated: topic.dateCreated.toISOString(),
      closed: topic.closed
    };
  }

  static toDTOArray(topics: Topic[]): TopicDTO[] {
    return topics.map(topic => this.toDTO(topic));
  }
}

