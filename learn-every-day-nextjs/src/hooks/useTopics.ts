import { useState, useCallback } from 'react';
import { RealTopicsService } from '../services/topics/RealTopicsService';
import type {
  TopicData,
  GetAllTopicsRequest,
  GetTopicByIdRequest,
  CreateTopicRequest,
  UpdateTopicRequest,
  DeleteTopicRequest,
  SearchTopicsRequest,
} from '../services/topics/types';

export function useTopics() {
  const [topics, setTopics] = useState<TopicData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const topicsService = new RealTopicsService();

  const getAllTopics = useCallback(async (request?: GetAllTopicsRequest) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await topicsService.getAllTopics(request);
      
      if (response.success && response.topics) {
        setTopics(response.topics);
        return response.topics;
      } else {
        setError(response.message);
        return [];
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching topics';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [topicsService]);

  const getTopicById = useCallback(async (request: GetTopicByIdRequest) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await topicsService.getTopicById(request);
      
      if (response.success && response.topic) {
        return response.topic;
      } else {
        setError(response.message);
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching the topic';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [topicsService]);

  const createTopic = useCallback(async (request: CreateTopicRequest) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await topicsService.createTopic(request);
      
      if (response.success && response.topic) {
        // Add the new topic to the list
        setTopics(prevTopics => [...prevTopics, response.topic!]);
        return response.topic;
      } else {
        setError(response.message);
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while creating the topic';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [topicsService]);

  const updateTopic = useCallback(async (request: UpdateTopicRequest) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await topicsService.updateTopic(request);
      
      if (response.success && response.topic) {
        // Update the topic in the list
        setTopics(prevTopics => 
          prevTopics.map(topic => 
            topic.id === request.id ? response.topic! : topic
          )
        );
        return response.topic;
      } else {
        setError(response.message);
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while updating the topic';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [topicsService]);

  const deleteTopic = useCallback(async (request: DeleteTopicRequest) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await topicsService.deleteTopic(request);
      
      if (response.success) {
        // Remove the topic from the list
        setTopics(prevTopics => prevTopics.filter(topic => topic.id !== request.id));
        return true;
      } else {
        setError(response.message);
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while deleting the topic';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [topicsService]);

  const searchTopics = useCallback(async (request: SearchTopicsRequest) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await topicsService.searchTopics(request);
      
      if (response.success && response.topics) {
        return response.topics;
      } else {
        setError(response.message);
        return [];
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while searching topics';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [topicsService]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    topics,
    loading,
    error,
    getAllTopics,
    getTopicById,
    createTopic,
    updateTopic,
    deleteTopic,
    searchTopics,
    clearError,
  };
} 