import { TopicHistory } from '../../domain/TopicHistory';
import { TopicHistoryDTO } from './TopicHistoryDTO';

export class TopicHistoryMapper {
  static toDTO(topicHistory: TopicHistory): TopicHistoryDTO {
    return {
      id: topicHistory.id,
      topicId: topicHistory.topicId,
      content: topicHistory.content,
      createdAt: topicHistory.createdAt.toISOString()
    };
  }

  static toDTOArray(topicHistories: TopicHistory[]): TopicHistoryDTO[] {
    return topicHistories.map(topicHistory => this.toDTO(topicHistory));
  }
}

