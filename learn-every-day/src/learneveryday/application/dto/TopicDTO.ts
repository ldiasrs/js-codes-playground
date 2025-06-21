import { Topic } from '../../domain/topic/entities/Topic';
import { TopicHistory } from '../../domain/topic-history/entities/TopicHistory';

export interface TopicHistoryDTO {
  id: string;
  topicId: string;
  content: string;
  createdAt: string;
}

export interface TopicDTO {
  id: string;
  subject: string;
  dateCreated: string;
  history: TopicHistoryDTO[];
}

export class TopicDTOMapper {
  static toDTO(entity: Topic, history: TopicHistory[] = []): TopicDTO {
    return {
      id: entity.id,
      subject: entity.subject,
      dateCreated: entity.dateCreated.toISOString(),
      history: history.map(h => ({
        id: h.id,
        topicId: h.topicId,
        content: h.content,
        createdAt: h.createdAt.toISOString(),
      })),
    };
  }

  static fromDTO(dto: TopicDTO): Topic {
    return new Topic(
      '', // customerId is not in DTO, would need to be provided separately
      dto.subject,
      dto.id,
      new Date(dto.dateCreated)
    );
  }
}

export class TopicHistoryDTOMapper {
  static toDTO(entity: TopicHistory): TopicHistoryDTO {
    return {
      id: entity.id,
      topicId: entity.topicId,
      content: entity.content,
      createdAt: entity.createdAt.toISOString(),
    };
  }

  static fromDTO(dto: TopicHistoryDTO): TopicHistory {
    return new TopicHistory(dto.topicId, dto.content, dto.id, new Date(dto.createdAt));
  }
} 