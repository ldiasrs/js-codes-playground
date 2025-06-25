# ChatGPT Topic History Generator Adapter

This adapter implements the `GenerateTopicHistoryPort` interface to generate new topic history content using OpenAI's ChatGPT API.

## Features

- Generates engaging learning history entries based on topic subject and existing history
- Builds context from previous learning entries to create coherent progression
- Configurable OpenAI parameters (model, max tokens, temperature)
- Environment variable support for API key management
- Error handling and validation

## Setup

### 1. Install Dependencies

The adapter requires the `openai` package, which should already be installed:

```bash
npm install openai
```

### 2. Configure Environment Variables

Create a `.env` file in your project root with your OpenAI API key:

```env
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=500
OPENAI_TEMPERATURE=0.7
```

### 3. Usage

#### Basic Usage with Environment Variables

```typescript
import { TopicHistoryGeneratorFactory } from '../infrastructure/factories/TopicHistoryGeneratorFactory';

// Create generator using environment variables
const generator = TopicHistoryGeneratorFactory.createChatGptGeneratorFromEnv();

// Generate new content
const newContent = await generator.generate({
  topicSubject: 'TypeScript Advanced Features',
  history: existingHistoryArray
});
```

#### Usage with Custom API Key

```typescript
import { TopicHistoryGeneratorFactory } from '../infrastructure/factories/TopicHistoryGeneratorFactory';

// Create generator with custom API key
const generator = TopicHistoryGeneratorFactory.createChatGptGenerator('your-api-key');

const newContent = await generator.generate({
  topicSubject: 'JavaScript Promises',
  history: []
});
```

#### Direct Usage

```typescript
import { ChatGptTopicHistoryGenerator } from '../infrastructure/adapters/ChatGptTopicHistoryGenerator';

const generator = new ChatGptTopicHistoryGenerator('your-api-key');
const newContent = await generator.generate({
  topicSubject: 'React Hooks',
  history: existingHistory
});
```

## How It Works

1. **Prompt Building**: The adapter creates a comprehensive prompt that includes:
   - The topic subject
   - Previous learning entries (up to 5 most recent)
   - Instructions for generating new content

2. **Context Preservation**: Previous entries are formatted with dates and content to provide context for the AI

3. **Content Generation**: Uses OpenAI's ChatGPT API to generate new learning content that:
   - Builds upon previous experiences
   - Provides new insights
   - Maintains a conversational, learning-focused tone
   - Includes practical takeaways

4. **Error Handling**: Comprehensive error handling for API failures and invalid responses

## Configuration Options

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `OPENAI_API_KEY` | Required | Your OpenAI API key |
| `OPENAI_MODEL` | `gpt-3.5-turbo` | The OpenAI model to use |
| `OPENAI_MAX_TOKENS` | `500` | Maximum tokens for the response |
| `OPENAI_TEMPERATURE` | `0.7` | Creativity level (0.0 to 1.0) |

## Example Output

The adapter generates content like:

```
Today I explored TypeScript's utility types, particularly focusing on Partial<T>, Required<T>, and Pick<T>. These utility types are incredibly powerful for creating flexible type definitions. I learned how Partial<T> makes all properties optional, which is perfect for update operations, while Required<T> does the opposite. Pick<T> allows you to select specific properties from a type, which is great for creating focused interfaces. The practical application I discovered is using these in API response handling where you might need different subsets of data for different use cases.
```

## Error Handling

The adapter throws descriptive errors for:
- Missing API key
- API request failures
- Invalid responses
- Network issues

## Testing

See `examples/chatgpt-topic-history-example.ts` for a complete usage example.

## Dependencies

- `openai`: OpenAI API client
- `moment`: Date formatting and manipulation
- `dotenv`: Environment variable loading 