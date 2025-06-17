# Scheduling System

A robust scheduling system built with node-cron that allows you to schedule and execute tasks at specified intervals. The system includes database persistence, task management, and a flexible architecture for adding new task types.

## Features

- **Cron-based Scheduling**: Uses node-cron for reliable task scheduling
- **Database Persistence**: All scheduled tasks are persisted to JSON files
- **Task Management**: Create, update, delete, and monitor scheduled tasks
- **Extensible Architecture**: Easy to add new task types and executors
- **Error Handling**: Comprehensive error handling and task status tracking
- **Hourly Checks**: Automatic hourly checks for new tasks to schedule

## Architecture

### Domain Layer

- **ScheduledTask**: Entity representing a scheduled task
- **TaskExecutorPort**: Interface for task executors
- **ScheduledTaskRepositoryPort**: Interface for task persistence
- **SchedulingService**: Core service managing cron jobs and task execution

### Infrastructure Layer

- **JsonScheduledTaskRepository**: JSON-based implementation for task persistence
- **SchedulingServiceFactory**: Factory for creating scheduling services with dependencies

### Application Layer

- **SchedulerProcess**: High-level process for running the scheduler
- **SendLastTopicHistoryTask**: Example task implementation

## Task Types

### SendLastTopicHistory

Sends the most recent topic history to all customers via email.

**Cron Expression Examples:**
- `0 9 * * *` - Every day at 9:00 AM
- `0 * * * *` - Every hour
- `0 9,18 * * *` - Every day at 9:00 AM and 6:00 PM

## Usage

### Starting the Scheduler

```bash
# Run the scheduler
npm run scheduler

# Run in development mode with auto-restart
npm run scheduler:dev
```

### Programmatic Usage

```typescript
import { SchedulerProcess } from './learneveryday/scheduler';

const scheduler = new SchedulerProcess('./data');

// Start the scheduler
await scheduler.start();

// Schedule a task
await scheduler.scheduleTask(
  'SendLastTopicHistory',
  '0 9 * * *', // Every day at 9:00 AM
  { description: 'Daily topic history email' }
);

// Remove a task
await scheduler.removeTask('task-id');

// Get status
const status = scheduler.getStatus();
console.log(status);

// Stop the scheduler
scheduler.stop();
```

### Creating Custom Tasks

1. **Create a Task Executor**:

```typescript
import { TaskExecutorPort } from '../ports/TaskExecutorPort';
import { ScheduledTask } from '../entities/ScheduledTask';

export class MyCustomTask implements TaskExecutorPort {
  canHandle(taskType: string): boolean {
    return taskType === 'MyCustomTask';
  }

  async execute(task: ScheduledTask): Promise<void> {
    // Your task logic here
    console.log('Executing custom task:', task.id);
  }
}
```

2. **Register the Task Executor**:

```typescript
const schedulingService = new SchedulingService(repository);
schedulingService.registerTaskExecutor('MyCustomTask', new MyCustomTask());
```

3. **Schedule the Task**:

```typescript
const task = new ScheduledTask('MyCustomTask', {}, '0 * * * *');
await schedulingService.scheduleTask(task);
```

## Cron Expressions

The system uses standard cron expressions:

```
* * * * *
│ │ │ │ │
│ │ │ │ └── Day of week (0-7, Sunday = 0 or 7)
│ │ │ └──── Month (1-12)
│ │ └────── Day of month (1-31)
│ └──────── Hour (0-23)
└────────── Minute (0-59)
```

**Common Examples:**
- `0 9 * * *` - Every day at 9:00 AM
- `0 * * * *` - Every hour
- `0 9,18 * * *` - Every day at 9:00 AM and 6:00 PM
- `0 9 * * 1-5` - Every weekday at 9:00 AM
- `0 0 1 * *` - First day of every month at midnight

## Task Status

Tasks can have the following statuses:

- **pending**: Task is scheduled but not yet executed
- **running**: Task is currently being executed
- **completed**: Task completed successfully
- **failed**: Task failed with an error
- **cancelled**: Task was cancelled

## Data Persistence

Tasks are persisted in JSON format in the `data/scheduled-tasks.json` file:

```json
[
  {
    "id": "task-id",
    "taskType": "SendLastTopicHistory",
    "taskData": { "description": "Daily email" },
    "cronExpression": "0 9 * * *",
    "status": "pending",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "isActive": true
  }
]
```

## Configuration

### Environment Variables

The scheduler uses the same environment variables as the email system:

- `EMAIL_USER`: Email username
- `EMAIL_PASS`: Email password
- `OPENAI_API_KEY`: OpenAI API key (if using AI features)

### Data Directory

By default, the scheduler uses `./data` as the data directory. You can customize this:

```typescript
const scheduler = new SchedulerProcess('/path/to/data');
```

## Monitoring

The scheduler provides status information:

```typescript
const status = scheduler.getStatus();
console.log(status);
// Output: { isRunning: true, serviceStatus: { isRunning: true, activeJobs: 2, registeredExecutors: 1 } }
```

## Error Handling

- Failed tasks are marked with error messages
- Individual customer failures don't stop the entire task
- Comprehensive logging for debugging
- Graceful shutdown handling

## Dependencies

- `node-cron`: Cron job scheduling
- `moment`: Date/time manipulation
- `uuid`: Unique ID generation
- `nodemailer`: Email sending (for SendLastTopicHistory task)

## Development

### Adding New Task Types

1. Create a new task executor implementing `TaskExecutorPort`
2. Register the executor in `SchedulingServiceFactory`
3. Add the task type to the `TaskType` union type
4. Update this README with usage examples

### Testing

The scheduling system is designed to be testable:

- Use dependency injection for repositories and services
- Mock external dependencies (email, AI services)
- Test task execution in isolation

## Troubleshooting

### Common Issues

1. **Tasks not executing**: Check cron expressions and task status
2. **Email failures**: Verify email configuration and credentials
3. **Data persistence issues**: Check file permissions and data directory
4. **Memory leaks**: Ensure proper cleanup of cron jobs

### Logs

The scheduler provides detailed logging:

- Task execution start/completion
- Error messages and stack traces
- Service status updates
- Cron job creation/removal

## Security Considerations

- Store sensitive data (API keys, passwords) in environment variables
- Validate cron expressions to prevent injection attacks
- Implement proper access controls for task management
- Monitor task execution for unusual patterns 