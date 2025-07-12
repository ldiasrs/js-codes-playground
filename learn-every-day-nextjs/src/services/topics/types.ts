export interface TopicData {
  id: string;
  subject: string;
  dateCreated: string;
  dateUpdated: string;
  closed: boolean;
  history?: TopicHistoryData[];
}

export interface TopicHistoryData {
  id: string;
  content: string;
  dateCreated: string;
}

export interface GetAllTopicsRequest {
  customerId: string;
}

export interface GetAllTopicsResponse {
  success: boolean;
  message: string;
  topics?: TopicData[];
}

export interface GetTopicByIdRequest {
  id: string;
}

export interface GetTopicByIdResponse {
  success: boolean;
  message: string;
  topic?: TopicData;
}

export interface CreateTopicRequest {
  customerId: string;
  subject: string;
}

export interface CreateTopicResponse {
  success: boolean;
  message: string;
  topic?: TopicData;
}

export interface UpdateTopicRequest {
  id: string;
  subject: string;
}

export interface UpdateTopicResponse {
  success: boolean;
  message: string;
  topic?: TopicData;
}

export interface CloseTopicRequest {
  id: string;
}

export interface CloseTopicResponse {
  success: boolean;
  message: string;
  topic?: TopicData;
}

export interface DeleteTopicRequest {
  id: string;
}

export interface DeleteTopicResponse {
  success: boolean;
  message: string;
}

export interface SearchTopicsRequest {
  customerId: string;
  query: string;
}

export interface SearchTopicsResponse {
  success: boolean;
  message: string;
  topics?: TopicData[];
}

export interface GetTopicHistoriesRequest {
  topicId: string;
}

export interface GetTopicHistoriesResponse {
  success: boolean;
  message: string;
  topicHistories?: TopicHistoryData[];
} 