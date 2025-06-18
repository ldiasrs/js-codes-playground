import "reflect-metadata";
import { injectable, inject } from "inversify";
import { TaskProcess } from "../../taskprocess/entities/TaskProcess";
import { TaskProcessRunner } from "../../taskprocess/ports/TaskProcessRunner";
import { TaskProcessRepositoryPort } from "../../taskprocess/ports/TaskProcessRepositoryPort";
import { TopicRepositoryPort } from "../../topic/ports/TopicRepositoryPort";
import { TopicHistoryRepositoryPort } from "../ports/TopicHistoryRepositoryPort";
import { TYPES } from "../../../infrastructure/di/types";

@injectable()
export class ScheduleGenerateTopicHistoryTaskRunner
  implements TaskProcessRunner {
  constructor(
    @inject(TYPES.TopicRepository)
    private readonly topicRepository: TopicRepositoryPort,
    @inject(TYPES.TopicHistoryRepository)
    private readonly topicHistoryRepository: TopicHistoryRepositoryPort,
    @inject(TYPES.TaskProcessRepository)
    private readonly taskProcessRepository: TaskProcessRepositoryPort
  ) {}

  /**
   * Executes the schedule topic history generation task
   * @param taskProcess The task process containing the customer ID in entityId
   * @returns Promise<void> Resolves when task is scheduled or skipped
   * @throws Error if customer has no topics or task creation fails
   */
  async execute(taskProcess: TaskProcess): Promise<void> {
    const customerId = taskProcess.entityId;

    // Step 1: Check if customer has any topics
    const customerTopics = await this.topicRepository.findByCustomerId(
      customerId
    );
    if (!customerTopics || customerTopics.length === 0) {
      throw new Error(`Customer with ID ${customerId} has no topics`);
    }

    // Step 2: Check if there's already a pending topic-history-generation task for this customer
    const existingTasks = await this.taskProcessRepository.search({
      customerId: customerId,
      type: "topic-history-generation",
      status: "pending",
    });

    if (existingTasks && existingTasks.length > 0) {
      console.log(
        `Skipping task creation - customer ${customerId} already has a pending topic-history-generation task: ${existingTasks[0].id}`
      );
    } else {
      // Step 3: Find the topic with the oldest topic history
      const topicWithOldestHistory = await this.findTopicWithOldestHistory(
        customerTopics
      );

      if (topicWithOldestHistory) {
        // Step 4: Create a new TaskProcess for topic history generation
        const scheduledTime = new Date();
        scheduledTime.setMinutes(scheduledTime.getMinutes());

        const newTaskProcess = new TaskProcess(
          topicWithOldestHistory.id, // Use the topic with oldest history as entityId
          customerId,
          "topic-history-generation",
          "pending",
          undefined, // id will be auto-generated
          undefined, // errorMsg
          scheduledTime // scheduledTo
        );

        // Step 5: Save the new task process
        await this.taskProcessRepository.save(newTaskProcess);

        console.log(
          `Scheduled topic history generation task for customer ${customerId} using topic ${
            topicWithOldestHistory.id
          } (oldest history), scheduled for: ${scheduledTime.toISOString()}`
        );
      } else {
        console.log(
          `No topic with oldest history found for customer ${customerId}`
        );
      }
    }

    // Step 8: Create a new TaskProcess for schedule-generation-topic-history (next 24 hours)
    const scheduledTime24h = new Date();
    scheduledTime24h.setHours(scheduledTime24h.getHours() + 24); // Schedule for 24 hours from now

    const newScheduleTaskProcess = new TaskProcess(
      customerId, // Use the customer ID as entityId
      customerId,
      "schedule-generation-topic-history",
      "pending",
      undefined, // id will be auto-generated
      undefined, // errorMsg
      scheduledTime24h // scheduledTo
    );

    // Step 9: Save the new schedule task process
    await this.taskProcessRepository.save(newScheduleTaskProcess);

    console.log(
      `Scheduled schedule-generation-topic-history task for customer ${customerId}, scheduled for: ${scheduledTime24h.toISOString()}`
    );
  }

  /**
   * Finds the topic with the oldest topic history among the given topics
   * @param topics Array of topics to check
   * @returns Promise<Topic> The topic with the oldest history, or the first topic if no histories exist
   */
  private async findTopicWithOldestHistory(topics: any[]): Promise<any> {
    let oldestTopicHistory: any = null;
    let oldestTopic: any = null;
    let oldestDate: Date | null = null;

    // Check each topic for its oldest history
    for (const topic of topics) {
      const topicHistories = await this.topicHistoryRepository.findByTopicId(
        topic.id
      );

      if (topicHistories && topicHistories.length > 0) {
        // Find the oldest history for this topic
        const oldestHistoryForTopic = topicHistories.reduce((oldest, current) =>
          current.createdAt < oldest.createdAt ? current : oldest
        );

        // Compare with the overall oldest
        if (!oldestDate || oldestHistoryForTopic.createdAt < oldestDate) {
          oldestDate = oldestHistoryForTopic.createdAt;
          oldestTopicHistory = oldestHistoryForTopic;
          oldestTopic = topic;
        }
      }
    }

    // If no topic histories found, return the first topic
    if (!oldestTopic) {
      console.log(
        `No topic histories found for customer, using first topic: ${topics[0].id}`
      );
      return topics[0];
    }

    console.log(
      `Found topic with oldest history: ${
        oldestTopic.id
      }, oldest history created at: ${oldestDate?.toISOString()}`
    );
    return oldestTopic;
  }
}
