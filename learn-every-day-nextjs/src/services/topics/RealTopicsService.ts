import { TopicsService } from './TopicsService';
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

export class RealTopicsService implements TopicsService {
  /**
   * Retrieves all topics for a customer
   */
  async getAllTopics(request?: GetAllTopicsRequest): Promise<GetAllTopicsResponse> {
    try {
      const url = request?.customerId 
        ? `/api/topics?customerId=${encodeURIComponent(request.customerId)}`
        : '/api/topics';
        
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        return {
          success: true,
          message: result.message,
          topics: result.topics,
        };
      } else {
        return {
          success: false,
          message: result.message,
        };
      }
    } catch (error) {
      console.error('Get all topics error:', error);
      return {
        success: false,
        message: 'An error occurred while fetching topics. Please try again.',
      };
    }
  }

  /**
   * Retrieves a specific topic by ID
   */
  async getTopicById(request: GetTopicByIdRequest): Promise<GetTopicByIdResponse> {
    try {
      const response = await fetch(`/api/topics/${request.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        return {
          success: true,
          message: result.message,
          topic: result.topic,
        };
      } else {
        return {
          success: false,
          message: result.message,
        };
      }
    } catch (error) {
      console.error('Get topic by ID error:', error);
      return {
        success: false,
        message: 'An error occurred while fetching the topic. Please try again.',
      };
    }
  }

  /**
   * Creates a new topic
   */
  async createTopic(request: CreateTopicRequest): Promise<CreateTopicResponse> {
    try {
      const response = await fetch('/api/topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: request.customerId,
          subject: request.subject,
        }),
      });

      const result = await response.json();

      if (result.success) {
        return {
          success: true,
          message: result.message,
          topic: result.topic,
        };
      } else {
        return {
          success: false,
          message: result.message,
        };
      }
    } catch (error) {
      console.error('Create topic error:', error);
      return {
        success: false,
        message: 'An error occurred while creating the topic. Please try again.',
      };
    }
  }

  /**
   * Updates an existing topic
   */
  async updateTopic(request: UpdateTopicRequest): Promise<UpdateTopicResponse> {
    try {
      const response = await fetch(`/api/topics/${request.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: request.subject,
        }),
      });

      const result = await response.json();

      if (result.success) {
        return {
          success: true,
          message: result.message,
          topic: result.topic,
        };
      } else {
        return {
          success: false,
          message: result.message,
        };
      }
    } catch (error) {
      console.error('Update topic error:', error);
      return {
        success: false,
        message: 'An error occurred while updating the topic. Please try again.',
      };
    }
  }

  /**
   * Deletes a topic
   */
  async deleteTopic(request: DeleteTopicRequest): Promise<DeleteTopicResponse> {
    try {
      const response = await fetch(`/api/topics/${request.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        return {
          success: true,
          message: result.message,
        };
      } else {
        return {
          success: false,
          message: result.message,
        };
      }
    } catch (error) {
      console.error('Delete topic error:', error);
      return {
        success: false,
        message: 'An error occurred while deleting the topic. Please try again.',
      };
    }
  }

  /**
   * Searches topics by query
   */
  async searchTopics(request: SearchTopicsRequest): Promise<SearchTopicsResponse> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('q', request.query);
      queryParams.append('customerId', request.customerId);
      
      const response = await fetch(`/api/topics/search?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        return {
          success: true,
          message: result.message,
          topics: result.topics,
        };
      } else {
        return {
          success: false,
          message: result.message,
        };
      }
    } catch (error) {
      console.error('Search topics error:', error);
      return {
        success: false,
        message: 'An error occurred while searching topics. Please try again.',
      };
    }
  }
} 