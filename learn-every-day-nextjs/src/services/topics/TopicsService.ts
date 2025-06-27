import {
  GetAllTopicsRequest,
  GetAllTopicsResponse,
  GetTopicByIdRequest,
  GetTopicByIdResponse,
  CreateTopicRequest,
  CreateTopicResponse,
  UpdateTopicRequest,
  UpdateTopicResponse,
  DeleteTopicRequest,
  DeleteTopicResponse,
  SearchTopicsRequest,
  SearchTopicsResponse,
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
   * Deletes a topic
   */
  deleteTopic(request: DeleteTopicRequest): Promise<DeleteTopicResponse>;

  /**
   * Searches topics by query
   */
  searchTopics(request: SearchTopicsRequest): Promise<SearchTopicsResponse>;
} 