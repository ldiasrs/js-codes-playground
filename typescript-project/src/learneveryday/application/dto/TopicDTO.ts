import { Topic } from '../../domain/entities/Topic';
import { TopicHistory } from '../../domain/entities/TopicHistory';

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
  static toDTO(entity: Topic): TopicDTO {
    return {
      id: entity.id,
      subject: entity.subject,
      dateCreated: entity.dateCreated.toISOString(),
      history: entity.history.map(h => ({
        id: h.id,
        topicId: h.topicId,
        content: h.content,
        createdAt: h.createdAt.toISOString(),
      })),
    };
  }

  static fromDTO(dto: TopicDTO): Topic {
    return new Topic(
      dto.subject,
      dto.id,
      new Date(dto.dateCreated),
      dto.history.map(h => ({
        id: h.id,
        topicId: h.topicId,
        content: h.content,
        createdAt: new Date(h.createdAt),
      }))
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