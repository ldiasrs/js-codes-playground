import { BaseQuery } from '../Query';
import { TopicHistoryDTO, TopicHistoryDTOMapper } from '../../dto/TopicDTO';
import { GetTopicHistoriesFeature, GetTopicHistoriesFeatureData } from '../../../domain/topic-history/usecase/GetTopicHistoriesFeature';

export interface GetTopicHistoriesQueryData {
  topicId: string;
}

export class GetTopicHistoriesQuery extends BaseQuery<TopicHistoryDTO[], GetTopicHistoriesQueryData> {
  constructor(
    private readonly getTopicHistoriesFeature: GetTopicHistoriesFeature
  ) {
    super();
  }

  async execute(data: GetTopicHistoriesQueryData): Promise<TopicHistoryDTO[]> {
    const featureData: GetTopicHistoriesFeatureData = {
      topicId: data.topicId
    };
    
    const topicHistories = await this.getTopicHistoriesFeature.execute(featureData);
    return topicHistories.map(history => TopicHistoryDTOMapper.toDTO(history));
  }
} 