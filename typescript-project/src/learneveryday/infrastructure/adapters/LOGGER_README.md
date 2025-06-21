# Logging System

This document describes the logging system implemented using hexagonal architecture principles.

## Overview

The logging system provides a flexible, extensible logging solution that follows the hexagonal architecture pattern. It consists of:

- **LoggerPort**: The domain interface defining the logging contract
- **Multiple Implementations**: Console, File, and Composite loggers
- **Factory Pattern**: Easy creation of different logger configurations
- **Dependency Injection**: Seamless integration with the application

## Architecture

### Domain Layer (Ports)

Located in `domain/shared/ports/LoggerPort.ts`:

```typescript
export interface LoggerPort {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: Error, context?: LogContext): void;
  log(level: LogLevel, message: string, context?: LogContext): void;
  child(context: LogContext): LoggerPort;
}
```

### Infrastructure Layer (Adapters)

Three main implementations:

1. **ConsoleLogger**: Outputs to console with emojis and formatting
2. **FileLogger**: Writes to files with rotation and size limits
3. **CompositeLogger**: Combines multiple loggers

## Usage

### Basic Usage

```typescript
import { inject, injectable } from 'inversify';
import { LoggerPort } from '../../domain/shared/ports/LoggerPort';
import { TYPES } from '../di/types';

@injectable()
export class MyService {
  constructor(
    @inject(TYPES.Logger) private readonly logger: LoggerPort
  ) {}

  async doSomething(): Promise<void> {
    this.logger.info('Starting operation');
    
    try {
      // ... business logic
      this.logger.info('Operation completed successfully', { 
        operationId: '123',
        duration: 1500 
      });
    } catch (error) {
      this.logger.error('Operation failed', error as Error, {
        operationId: '123'
      });
    }
  }
}
```

### Creating Child Loggers

```typescript
// Create a child logger with additional context
const childLogger = this.logger.child({ 
  userId: 'user123',
  sessionId: 'session456' 
});

childLogger.info('User action performed', { action: 'login' });
// Output: ℹ️ [2024-01-15T10:30:00.000Z] INFO: User action performed | {"userId":"user123","sessionId":"session456","action":"login"}
```

### Using the Factory

```typescript
import { LoggerFactory } from '../factories/LoggerFactory';

// Create different logger types
const consoleLogger = LoggerFactory.createDevelopmentLogger();
const fileLogger = LoggerFactory.createProductionLogger('./logs');
const compositeLogger = LoggerFactory.createComprehensiveLogger('./logs');

// Create from environment
const envLogger = LoggerFactory.createLoggerFromEnv();
```

## Configuration

### Environment Variables

- `NODE_ENV`: Determines logger type (development, production, test)
- `LOG_DIR`: Directory for log files (default: './logs')

### Logger Types

1. **Development**: Console only with emojis
2. **Production**: File only with rotation
3. **Test**: Console only (minimal output)

### File Logger Configuration

```typescript
const fileLogger = LoggerFactory.createLogger({
  type: 'file',
  logDir: './logs',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
  context: { service: 'my-service' }
});
```

## Log Levels

- **DEBUG**: 🔍 Detailed debugging information
- **INFO**: ℹ️ General information
- **WARN**: ⚠️ Warning messages
- **ERROR**: ❌ Error messages with stack traces

## File Rotation

The FileLogger automatically rotates log files when they reach the maximum size:

- `info-2024-01-15.log` (current)
- `info-2024-01-15.log.1` (previous)
- `info-2024-01-15.log.2` (older)
- etc.

## Dependency Injection

The logger is automatically configured in the DI container:

```typescript
// In container.ts
this.container.bind<LoggerPort>(TYPES.Logger)
  .toDynamicValue(() => LoggerFactory.createLoggerFromEnv())
  .inSingletonScope();
```

## Extending the System

### Creating Custom Loggers

```typescript
@injectable()
export class CustomLogger implements LoggerPort {
  // Implement all LoggerPort methods
  debug(message: string, context?: LogContext): void {
    // Custom implementation
  }
  
  // ... other methods
}
```

### Adding to DI Container

```typescript
// In types.ts
Logger: Symbol.for('Logger'),

// In container.ts
this.container.bind<LoggerPort>(TYPES.Logger)
  .to(CustomLogger)
  .inSingletonScope();
```

## Best Practices

1. **Use structured logging**: Include context objects for better searchability
2. **Log at appropriate levels**: Use DEBUG for development, INFO for general flow, ERROR for issues
3. **Include relevant context**: Add operation IDs, user IDs, timestamps
4. **Use child loggers**: For operations that span multiple methods
5. **Don't log sensitive data**: Avoid logging passwords, tokens, or PII

## Example Output

### Console Logger
```
ℹ️ [2024-01-15T10:30:00.000Z] INFO: Starting task processing workflow for all customers | {"environment":"development","service":"learneveryday"}
📅 [2024-01-15T10:30:01.000Z] INFO: Step 1: Scheduling topic history generation... | {"environment":"development","service":"learneveryday"}
✅ [2024-01-15T10:30:02.000Z] INFO: Topic history scheduling completed | {"environment":"development","service":"learneveryday"}
```

### File Logger
```
[2024-01-15T10:30:00.000Z] INFO: Starting task processing workflow for all customers | {"environment":"production","service":"learneveryday"}
[2024-01-15T10:30:01.000Z] INFO: Step 1: Scheduling topic history generation... | {"environment":"production","service":"learneveryday"}
[2024-01-15T10:30:02.000Z] INFO: Topic history scheduling completed | {"environment":"production","service":"learneveryday"}
``` 