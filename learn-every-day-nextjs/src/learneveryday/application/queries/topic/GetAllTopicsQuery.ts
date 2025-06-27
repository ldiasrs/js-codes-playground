import { BaseQuery } from '../Query';
import { TopicDTO, TopicDTOMapper } from '../../dto/TopicDTO';
import { GetAllTopicsFeature, GetAllTopicsFeatureData } from '../../../domain/topic/usecase/GetAllTopicsFeature';

export interface GetAllTopicsQueryData {
  customerId: string;
}

export class GetAllTopicsQuery extends BaseQuery<TopicDTO[], GetAllTopicsQueryData> {
  constructor(
    private readonly getAllTopicsFeature: GetAllTopicsFeature
  ) {
    super();
  }

  async execute(data: GetAllTopicsQueryData): Promise<TopicDTO[]> {
    const featureData: GetAllTopicsFeatureData = {
      customerId: data.customerId
    };
    
    const topics = await this.getAllTopicsFeature.execute(featureData);
    return topics.map(topic => TopicDTOMapper.toDTO(topic));
  }
} 