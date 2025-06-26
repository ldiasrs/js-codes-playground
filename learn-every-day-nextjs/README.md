# Learn Every Day - Next.js Application

This is a [Next.js](https://nextjs.org) application for managing learning topics and generating content using AI.

## Features

- Customer authentication with email verification
- Topic management for learning subjects
- AI-powered content generation for topics
- Background task processing
- Multi-database support (SQLite/PostgreSQL)

## Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Gmail account (for email sending)
- OpenAI API key (for content generation)

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd learn-every-day-nextjs
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Setup local configuration

Copy the example configuration file and customize it with your settings:

```bash
cp config/global-config.local.json.example config/global-config.local.json
```

Edit `config/global-config.local.json` with your actual values:

- **Email settings**: Your Gmail credentials and app password
- **OpenAI API key**: Your OpenAI API key for content generation
- **Encryption key**: Generate a 32-character key for data encryption

#### Generate a 32-character encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex').slice(0, 32))"
```

### 4. Setup the database

Initialize the database with all required tables and indexes:

```bash
npm run db:setup
```

### 5. Run the development server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:setup` - Initialize database structure
- `npm run db:reset` - Reset database (drops all tables)

## Database Management

The application supports both SQLite (default) and PostgreSQL databases.

### SQLite (Development)
- Database file: `./data/local/learneveryday.db`
- No additional setup required

### PostgreSQL (Production)
Update the database configuration in `config/global-config.local.json`:

```json
{
  "database": {
    "type": "postgres",
    "postgres": {
      "host": "localhost",
      "port": 5432,
      "database": "learneveryday",
      "username": "your-username",
      "password": "your-password",
      "ssl": false
    }
  }
}
```

## Configuration

The application uses a centralized configuration system. All settings are in `config/global-config.local.json`:

- **Database**: Connection settings for SQLite or PostgreSQL
- **Email**: SMTP settings for sending verification codes
- **OpenAI**: API settings for content generation
- **Logging**: Log level and output configuration
- **Encryption**: Key and algorithm for data encryption

## Security Notes

- The `config/global-config.local.json` file contains sensitive information and is not tracked in git
- Always use environment variables or secure configuration management in production
- Generate unique encryption keys for each environment
- Use app passwords for Gmail instead of regular passwords

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
