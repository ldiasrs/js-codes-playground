// Worker: Starts a Temporal worker that processes portfolio analysis workflows

import { Worker } from '@temporalio/worker';
import { createActivities } from './activities';
import { MockStockDataProvider } from './infrastructure/providers/mock-stock-data-provider';
import { MockNewsProvider } from './infrastructure/providers/mock-news-provider';
import { TASK_QUEUE } from './shared/constants';

async function run() {
  // Inject dependencies into activities
  const activities = createActivities({
    stockDataProvider: new MockStockDataProvider(),
    newsProvider: new MockNewsProvider(),
  });

  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflows/portfolio-analysis.workflow'),
    activities,
    taskQueue: TASK_QUEUE,
  });

  console.log(`Worker started, listening on task queue: ${TASK_QUEUE}`);
  await worker.run();
}

run().catch((err) => {
  console.error('Worker failed:', err);
  process.exit(1);
});
