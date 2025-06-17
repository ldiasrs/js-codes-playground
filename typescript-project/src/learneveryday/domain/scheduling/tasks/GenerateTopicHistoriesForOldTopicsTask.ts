import { GenerateTopicHistoriesForOldTopicsFeature } from '../../topic-history/features/GenerateTopicHistoriesForOldTopicsFeature';
import { TaskExecutorPort } from '../ports/TaskExecutorPort';
import { ScheduledTask } from '../entities/ScheduledTask';

export class GenerateTopicHistoriesForOldTopicsTask implements TaskExecutorPort {
  constructor(
    private readonly generateTopicHistoriesForOldTopicsFeature: GenerateTopicHistoriesForOldTopicsFeature
  ) {}

  canHandle(taskType: string): boolean {
    return taskType === 'GenerateTopicHistoriesForOldTopics';
  }

  async execute(task: ScheduledTask): Promise<void> {
    try {
      console.log(`🚀 Executing GenerateTopicHistoriesForOldTopicsTask for task ID: ${task.id}`);

      // Extract configuration from task data or use defaults
      const limit = task.taskData.limit || 10;
      const hoursSinceLastUpdate = task.taskData.hoursSinceLastUpdate || 24;

      console.log(`📊 Configuration: limit=${limit}, hoursSinceLastUpdate=${hoursSinceLastUpdate}`);

      // Execute the feature
      const result = await this.generateTopicHistoriesForOldTopicsFeature.execute({
        limit,
        hoursSinceLastUpdate
      });

      // Log the results
      console.log(`📈 Task Results:`);
      console.log(`   - Processed topics: ${result.processedTopics}`);
      console.log(`   - Successful generations: ${result.successfulGenerations}`);
      console.log(`   - Failed generations: ${result.failedGenerations}`);

      if (result.errors.length > 0) {
        console.log(`   - Errors: ${result.errors.length}`);
        result.errors.forEach(error => {
          console.log(`     - Topic ${error.topicId}: ${error.error}`);
        });
      }

      console.log(`✅ GenerateTopicHistoriesForOldTopicsTask completed for task ID: ${task.id}`);

    } catch (error) {
      console.error(`❌ GenerateTopicHistoriesForOldTopicsTask failed for task ID: ${task.id}:`, error);
      throw error;
    }
  }
} 