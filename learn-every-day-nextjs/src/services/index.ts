export type { AuthService } from './auth/AuthService';
export { RealAuthService } from './auth/RealAuthService';
export type { LoginRequest, LoginResponse, VerifyCodeRequest, VerifyCodeResponse, UserData, AuthState } from './auth/types';

export type { TopicsService } from './topics/TopicsService';
export { RealTopicsService } from './topics/RealTopicsService';
export type {
  TopicData,
  TopicHistoryData,
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
} from './topics/types'; 