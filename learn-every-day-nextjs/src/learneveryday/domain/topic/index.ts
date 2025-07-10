// Topic Domain Exports

// Entities
export { Topic } from './entities/Topic';

// Ports
export type { TopicRepositoryPort, TopicSearchCriteria } from './ports/TopicRepositoryPort';

// Use Cases
export type { AddTopicFeature, AddTopicFeatureData } from './usecase/AddTopicFeature';
export type { CloseTopicFeature, CloseTopicFeatureData } from './usecase/CloseTopicFeature';
export type { DeleteTopicFeature, DeleteTopicFeatureData } from './usecase/DeleteTopicFeature';
export type { UpdateTopicFeature, UpdateTopicFeatureData } from './usecase/UpdateTopicFeature'; 