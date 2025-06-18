import "reflect-metadata";
import { injectable, inject } from "inversify";
import { TaskProcess } from "../../taskprocess/entities/TaskProcess";
import { TaskProcessRunner } from "../../taskprocess/ports/TaskProcessRunner";
import { TaskProcessRepositoryPort } from "../../taskprocess/ports/TaskProcessRepositoryPort";
import { TopicRepositoryPort } from "../../topic/ports/TopicRepositoryPort";
import { TopicHistoryRepositoryPort } from "../ports/TopicHistoryRepositoryPort";
import { TYPES } from "../../../infrastructure/di/types";

export interface ReGenerateTopicHistoryConfig {
  maxTopicsPer24h: number; // 1 or 3
}

@injectable()
export class ReGenerateTopicHistoryTaskRunner
  implements TaskProcessRunner {
  private config: ReGenerateTopicHistoryConfig = { maxTopicsPer24h: 1 };

  constructor(
    @inject(TYPES.TopicRepository)
    private readonly topicRepository: TopicRepositoryPort,
    @inject(TYPES.TopicHistoryRepository)
    private readonly topicHistoryRepository: TopicHistoryRepositoryPort,
    @inject(TYPES.TaskProcessRepository)
    private readonly taskProcessRepository: TaskProcessRepositoryPort
  ) {}

  /**
   * Sets the configuration for the task runner
   * @param config Configuration object with maxTopicsPer24h
   */
  setConfig(config: ReGenerateTopicHistoryConfig): void {
    this.config = config;
  }

  /**
   * Executes the regenerate topic history task
   * @param taskProcess The task process containing the customer ID in entityId
   * @returns Promise<void> Resolves when task is processed
   * @throws Error if customer has no topics or task creation fails
   */
  async execute(taskProcess: TaskProcess): Promise<void> {
    const customerId = taskProcess.customerId;
    const topicId = taskProcess.entityId;

    // Step 1: Check if customer has any topics
    const customerTopics = await this.topicRepository.findByCustomerId(
      customerId
    );
    if (!customerTopics || customerTopics.length === 0) {
      throw new Error(`Customer with ID ${customerId} has no topics`);
    }

    // Step 2: Check if there are completed tasks in the last 24h
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const recentCompletedTasks = await this.taskProcessRepository.search({
      customerId: customerId,
      type: TaskProcess.GENERATE_TOPIC_HISTORY,
      dateFrom: twentyFourHoursAgo,
      dateTo: new Date()
    });

    // Step 3: Check if we've reached the maximum topics per 24h
    if (recentCompletedTasks.length >= this.config.maxTopicsPer24h) {
      // Find the newest completed task and schedule verification for 24h later
      const newestTask = recentCompletedTasks.reduce((latest, current) => 
        (current.createdAt && latest.createdAt && current.createdAt > latest.createdAt) ? current : latest
      );

      if (newestTask.createdAt) {
        const lastSendingDate = newestTask.createdAt;
        const verificationDate = new Date(lastSendingDate);
        verificationDate.setHours(verificationDate.getHours() + 24);

        // Create verification scheduled task
        const verificationTaskProcess = new TaskProcess(
          topicId, 
          customerId,
          TaskProcess.REGENERATE_TOPIC_HISTORY,
          "pending",
          undefined, // id will be auto-generated
          undefined, // errorMsg
          verificationDate // scheduledTo
        );

        await this.taskProcessRepository.save(verificationTaskProcess);

        console.log(
          `Scheduled verification task for customer ${customerId} due to maximum topics per 24h reached (${this.config.maxTopicsPer24h}). ` +
          `Last sending: ${lastSendingDate.toISOString()}, ` +
          `Next verification: ${verificationDate.toISOString()}`
        );
      }
      return;
    }

    // Step 4: Find topic with fewer histories and create generation task
    const topicWithLessHistories = await this.findTopicIdWithLessTopicsHistories(
      customerTopics
    );

    if (topicWithLessHistories) {
      // Create a new TaskProcess for topic history generation
      const scheduledTime = new Date();
      scheduledTime.setMinutes(scheduledTime.getMinutes());

      const newTaskProcess = new TaskProcess(
        topicWithLessHistories.id, // Use the topic with fewer histories as entityId
        customerId,
        TaskProcess.GENERATE_TOPIC_HISTORY,
        "pending",
        undefined, // id will be auto-generated
        undefined, // errorMsg
        scheduledTime // scheduledTo
      );

      // Save the new task process
      await this.taskProcessRepository.save(newTaskProcess);

      console.log(
        `Scheduled topic history generation task for customer ${customerId} using topic ${
          topicWithLessHistories.id
        } (fewer histories), scheduled for: ${scheduledTime.toISOString()}`
      );
    } else {
      console.log(
        `No topic with fewer histories found for customer ${customerId}`
      );
    }
  }

  /**
   * Finds the topic with fewer topic histories among the given topics
   * @param topics Array of topics to check
   * @returns Promise<Topic> The topic with fewer histories, or the first topic if no histories exist
   */
  private async findTopicIdWithLessTopicsHistories(topics: any[]): Promise<any> {
    let topicWithLessHistories: any = null;
    let leastHistories = Infinity;

    for (const topic of topics) {
      const topicHistories = await this.topicHistoryRepository.findByTopicId(
        topic.id
      );

      if (topicHistories && topicHistories.length < leastHistories) {
        leastHistories = topicHistories.length;
        topicWithLessHistories = topic;
      }
    }

    if (!topicWithLessHistories) {
      console.log(
        `No topic with fewer histories found for customer, using first topic: ${topics[0].id}`
      );
      return topics[0];
    }

    console.log(
      `Found topic with fewer histories: ${topicWithLessHistories.id}, with ${leastHistories} histories`
    );
    return topicWithLessHistories;
  }
}
