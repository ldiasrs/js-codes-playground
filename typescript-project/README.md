# LearnEveryday - Learning Management System

A comprehensive learning management system built with TypeScript, following Clean Architecture principles. This project helps users manage learning topics, generate content using AI, and send educational content via email.

## 🚀 Features

- **Customer Management**: Create and manage customer profiles with identification and contact information
- **Topic Management**: Organize learning topics for each customer
- **AI-Powered Content Generation**: Generate educational content using OpenAI's GPT models
- **Email Delivery**: Send generated content directly to customers via email
- **Scheduled Tasks**: Automated content generation and delivery through cron jobs
- **CLI Interface**: Command-line interface for easy interaction with the system
- **Data Persistence**: Local database storage using NeDB
- **Logging System**: Comprehensive logging with multiple output formats

## 🏗️ Architecture

This project follows **Clean Architecture** principles with a clear separation of concerns:

```
src/learneveryday/
├── domain/           # Business logic and entities
│   ├── customer/     # Customer domain
│   ├── topic/        # Topic domain
│   ├── topic-history/# Topic history domain
│   ├── taskprocess/  # Task processing domain
│   └── shared/       # Shared domain utilities
├── application/      # Application services and use cases
│   ├── commands/     # Command handlers
│   ├── queries/      # Query handlers
│   └── dto/          # Data Transfer Objects
└── infrastructure/   # External concerns
    ├── adapters/     # External service adapters
    │   ├── logs/     # Logging adapters
    │   └── repositories/ # Data access adapters
    ├── di/           # Dependency injection
    ├── factories/    # Factory classes
    └── scheduler/    # Task scheduling
```

### Key Design Patterns

- **Domain-Driven Design (DDD)**: Clear domain boundaries and business logic
- **Dependency Injection**: Using InversifyJS for IoC container
- **Repository Pattern**: Abstract data access layer
- **Command/Query Separation (CQRS)**: Separate read and write operations
- **Factory Pattern**: Object creation and configuration

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd typescript-project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key_here
   
   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   EMAIL_FROM=your_email@gmail.com
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

## 🎯 Usage

### CLI Commands

The system provides a comprehensive CLI interface for all operations:

#### Start the System
```bash
npm run cli start
```

#### Customer Management
```bash
# Create a new customer
npm run cli newCustomer -n "John Doe" -c "123.456.789-00" -e "john@example.com" -p "(11) 99999-9999"

# List all customers
npm run cli listCustomers

# Search customers
npm run cli searchCustomers -n "John"
```

#### Topic Management
```bash
# Create a new topic
npm run cli newTopic -c "customer-id" -s "JavaScript Fundamentals"

# List all topics
npm run cli listTopics

# Delete a topic
npm run cli deleteTopic -t "topic-id"
```

#### Content Generation and Delivery
```bash
# Generate and send topic history
npm run cli generateAndSendTopicHistory -t "topic-id" -e "recipient@example.com"

# Generate topic history only
npm run cli generateTopicHistory -t "topic-id"
```

#### Task Management
```bash
# List all scheduled tasks
npm run cli listTasks

# List tasks by status
npm run cli listTasks -s pending
npm run cli listTasks -s completed
npm run cli listTasks -s failed
```

### Scheduled Tasks

The system supports automated task processing:

1. **GenerateTopicHistoriesForOldTopics**: Automatically generates new content for topics that haven't been updated recently
2. **SendLastTopicHistory**: Sends the latest topic history to customers via email

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build the project
npm run clean           # Clean build artifacts

# Testing
npm run test            # Run tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage

# CLI
npm run cli             # Run CLI commands
npm run scheduler       # Start task scheduler
npm run scheduler:dev   # Start scheduler in development mode
```

### Project Structure

```
typescript-project/
├── src/
│   ├── learneveryday/          # Main application
│   │   ├── domain/             # Business logic
│   │   ├── application/        # Application services
│   │   └── infrastructure/     # External concerns
│   ├── common/                 # Shared utilities
│   ├── investments/            # Investment-related features
│   └── cli.ts                  # CLI entry point
├── data/                       # Database files
├── logs/                       # Application logs
├── config/                     # Configuration files
└── dist/                       # Compiled output
```

### Key Technologies

- **TypeScript**: Type-safe JavaScript development
- **InversifyJS**: Dependency injection container
- **NeDB**: Lightweight NoSQL database
- **OpenAI API**: AI-powered content generation
- **Nodemailer**: Email delivery
- **Commander.js**: CLI framework
- **Moment.js**: Date/time manipulation
- **Jest**: Testing framework

## 📊 Database

The system uses NeDB (Node.js embedded database) for data persistence. Database files are stored in the `data/` directory:

- `customers.db`: Customer information
- `topics.db`: Learning topics
- `topic-histories.db`: Generated content history
- `task-processes.db`: Scheduled task information

## 📧 Email Configuration

The system supports email delivery through SMTP. Configure your email settings in the `.env` file:

- **Gmail**: Use App Passwords for 2FA-enabled accounts
- **Other SMTP providers**: Update host, port, and credentials accordingly

## 🤖 AI Integration

Content generation is powered by OpenAI's GPT models. The system:

- Generates educational content based on topic subjects
- Maintains context and learning progression
- Supports multiple content formats and styles
- Handles API rate limits and errors gracefully

## 🧪 Testing

The project includes comprehensive testing:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📝 Logging

The system provides multiple logging options:

- **Console Logger**: Development and debugging
- **File Logger**: Production logging with rotation
- **Composite Logger**: Multiple output destinations

Logs are stored in the `logs/` directory with different levels (debug, info, warn, error).

## 🔒 Security

- Environment variables for sensitive configuration
- Input validation and sanitization
- Secure email delivery with proper authentication
- Database access through repository pattern

## 🚀 Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Set up environment variables**
   Ensure all required environment variables are configured

3. **Start the application**
   ```bash
   npm start
   ```

4. **For production**
   - Use a process manager like PM2
   - Set up proper logging and monitoring
   - Configure backup strategies for database files

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For issues and questions:

1. Check the existing documentation
2. Review the CLI examples in `src/learneveryday/cli-examples.md`
3. Check the logs for error details
4. Create an issue with detailed information

---

**LearnEveryday** - Making learning management simple and automated! 🎓 