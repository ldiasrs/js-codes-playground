import {
  GetAllTopicsRequest,
  GetAllTopicsResponse,
  GetTopicByIdRequest,
  GetTopicByIdResponse,
  CreateTopicRequest,
  CreateTopicResponse,
  UpdateTopicRequest,
  UpdateTopicResponse,
  CloseTopicRequest,
  CloseTopicResponse,
  DeleteTopicRequest,
  DeleteTopicResponse,
  SearchTopicsRequest,
  SearchTopicsResponse,
  GetTopicHistoriesRequest,
  GetTopicHistoriesResponse,
} from './types';

export interface TopicsService {
  /**
   * Retrieves all topics for a customer
   */
  getAllTopics(request?: GetAllTopicsRequest): Promise<GetAllTopicsResponse>;

  /**
   * Retrieves a specific topic by ID
   */
  getTopicById(request: GetTopicByIdRequest): Promise<GetTopicByIdResponse>;

  /**
   * Creates a new topic
   */
  createTopic(request: CreateTopicRequest): Promise<CreateTopicResponse>;

  /**
   * Updates an existing topic
   */
  updateTopic(request: UpdateTopicRequest): Promise<UpdateTopicResponse>;

  /**
   * Closes a topic
   */
  closeTopic(request: CloseTopicRequest): Promise<CloseTopicResponse>;

  /**
   * Deletes a topic
   */
  deleteTopic(request: DeleteTopicRequest): Promise<DeleteTopicResponse>;

  /**
   * Searches topics by query
   */
  searchTopics(request: SearchTopicsRequest): Promise<SearchTopicsResponse>;

  /**
   * Retrieves topic histories for a specific topic
   */
  getTopicHistories(request: GetTopicHistoriesRequest): Promise<GetTopicHistoriesResponse>;
} 