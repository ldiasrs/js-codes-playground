import "reflect-metadata";
import { injectable, inject } from "inversify";
import { TaskProcess } from "../../taskprocess/entities/TaskProcess";
import { TaskProcessRunner } from "../../taskprocess/ports/TaskProcessRunner";
import { TaskProcessRepositoryPort } from "../../taskprocess/ports/TaskProcessRepositoryPort";
import { TopicRepositoryPort } from "../../topic/ports/TopicRepositoryPort";
import { TopicHistoryRepositoryPort } from "../ports/TopicHistoryRepositoryPort";
import { TYPES } from "../../../infrastructure/di/types";

@injectable()
export class ReGenerateTopicHistoryTaskRunner
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

    // Step 2: Get all topic-history-send completed tasks in the last month
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const completedSendTasks = await this.taskProcessRepository.search({
      customerId: customerId,
      type: TaskProcess.SEND_TOPIC_HISTORY,
      status: "completed",
      dateFrom: oneMonthAgo,
      dateTo: new Date()
    });

    // Step 3: Check if there are more than 1 completed tasks in the last 24h
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const recentCompletedTasks = completedSendTasks.filter(task => 
      task.processAt && task.processAt >= twentyFourHoursAgo
    );

    if (recentCompletedTasks.length > 1) {
      // Step 4: Find the newest completed task and schedule verification
      const newestTask = recentCompletedTasks.reduce((latest, current) => 
        (current.processAt && latest.processAt && current.processAt > latest.processAt) ? current : latest
      );

      if (newestTask.processAt) {
        const lastSendingDate = newestTask.processAt;
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
          `Scheduled verification task for customer ${customerId} due to multiple recent sends. ` +
          `Last sending: ${lastSendingDate.toISOString()}, ` +
          `Next verification: ${verificationDate.toISOString()}`
        );
      }
    } else {
      // Step 5: Find topic with fewer histories and create generation task
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
