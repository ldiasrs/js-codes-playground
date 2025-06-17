import { SchedulerProcess } from './SchedulerProcess';
import { TaskType } from '../domain/scheduling/entities/ScheduledTask';

async function main() {
  const scheduler = new SchedulerProcess('./data');

  try {
    // Start the scheduler
    await scheduler.start();

    // Schedule a SendLastTopicHistory task to run every day at 9 AM
    await scheduler.scheduleTask(
      'SendLastTopicHistory',
      '0 9 * * *', // Every day at 9:00 AM
      { description: 'Send last topic history to all customers daily' }
    );

    console.log('✅ Scheduled SendLastTopicHistory task to run daily at 9:00 AM');

    // You can add more scheduled tasks here as needed
    // Example: Schedule a task to run every hour
    // await scheduler.scheduleTask(
    //   'SendLastTopicHistory',
    //   '0 * * * *', // Every hour
    //   { description: 'Send last topic history to all customers hourly' }
    // );

  } catch (error) {
    console.error('❌ Failed to start scheduler:', error);
    process.exit(1);
  }
}

// Run the scheduler if this file is executed directly
if (require.main === module) {
  main();
}

export { SchedulerProcess }; 