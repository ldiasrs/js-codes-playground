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
  CloseTopicRequest,
  CloseTopicResponse,
  DeleteTopicRequest,
  DeleteTopicResponse,
  SearchTopicsRequest,
  SearchTopicsResponse,
  GetTopicHistoriesRequest,
  GetTopicHistoriesResponse,
} from './types';

export class RealTopicsService implements TopicsService {
  /**
   * Gets customerId from sessionStorage
   */
  private getCustomerId(): string | null {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('customerId');
    }
    return null;
  }

  /**
   * Creates headers for API requests
   * Authentication is handled via HTTP-only cookies automatically
   */
  private createHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Retrieves all topics for a customer
   */
  async getAllTopics(request?: GetAllTopicsRequest): Promise<GetAllTopicsResponse> {
    try {
      const customerId = request?.customerId || this.getCustomerId();
      
      if (!customerId) {
        return {
          success: false,
          message: 'Customer ID is required. Please log in again.',
        };
      }

      const response = await fetch(`/api/topics?customerId=${encodeURIComponent(customerId)}`, {
        method: 'GET',
        headers: this.createHeaders(),
        credentials: 'include',
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
      const customerId = this.getCustomerId();
      
      if (!customerId) {
        return {
          success: false,
          message: 'Customer ID is required. Please log in again.',
        };
      }

      const response = await fetch(`/api/topics/${request.id}?customerId=${encodeURIComponent(customerId)}`, {
        method: 'GET',
        headers: this.createHeaders(),
        credentials: 'include',
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
      const customerId = request.customerId || this.getCustomerId();
      
      if (!customerId) {
        return {
          success: false,
          message: 'Customer ID is required. Please log in again.',
        };
      }

      const response = await fetch('/api/topics', {
        method: 'POST',
        headers: this.createHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          customerId,
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
      const customerId = this.getCustomerId();
      
      if (!customerId) {
        return {
          success: false,
          message: 'Customer ID is required. Please log in again.',
        };
      }

      const response = await fetch(`/api/topics/${request.id}?customerId=${encodeURIComponent(customerId)}`, {
        method: 'PUT',
        headers: this.createHeaders(),
        credentials: 'include',
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
   * Closes a topic
   */
  async closeTopic(request: CloseTopicRequest): Promise<CloseTopicResponse> {
    try {
      const customerId = this.getCustomerId();
      
      if (!customerId) {
        return {
          success: false,
          message: 'Customer ID is required. Please log in again.',
        };
      }

      const response = await fetch(`/api/topics/${request.id}/close?customerId=${encodeURIComponent(customerId)}`, {
        method: 'PATCH',
        headers: this.createHeaders(),
        credentials: 'include',
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
      console.error('Close topic error:', error);
      return {
        success: false,
        message: 'An error occurred while closing the topic. Please try again.',
      };
    }
  }

  /**
   * Deletes a topic
   */
  async deleteTopic(request: DeleteTopicRequest): Promise<DeleteTopicResponse> {
    try {
      const customerId = this.getCustomerId();
      
      if (!customerId) {
        return {
          success: false,
          message: 'Customer ID is required. Please log in again.',
        };
      }

      const response = await fetch(`/api/topics/${request.id}?customerId=${encodeURIComponent(customerId)}`, {
        method: 'DELETE',
        headers: this.createHeaders(),
        credentials: 'include',
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
      const customerId = request.customerId || this.getCustomerId();
      
      if (!customerId) {
        return {
          success: false,
          message: 'Customer ID is required. Please log in again.',
        };
      }

      const queryParams = new URLSearchParams();
      queryParams.append('q', request.query);
      queryParams.append('customerId', customerId);
      
      const response = await fetch(`/api/topics/search?${queryParams.toString()}`, {
        method: 'GET',
        headers: this.createHeaders(),
        credentials: 'include',
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

  /**
   * Retrieves topic histories for a specific topic
   */
  async getTopicHistories(request: GetTopicHistoriesRequest): Promise<GetTopicHistoriesResponse> {
    try {
      const response = await fetch(`/api/topics/${request.topicId}/histories`, {
        method: 'GET',
        headers: this.createHeaders(),
        credentials: 'include',
      });

      const result = await response.json();

      if (result.success) {
        return {
          success: true,
          message: result.message,
          topicHistories: result.topicHistories,
        };
      } else {
        return {
          success: false,
          message: result.message,
        };
      }
    } catch (error) {
      console.error('Get topic histories error:', error);
      return {
        success: false,
        message: 'An error occurred while fetching topic histories. Please try again.',
      };
    }
  }
} 