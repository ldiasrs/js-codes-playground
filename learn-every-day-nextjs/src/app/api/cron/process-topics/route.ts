import { NextResponse } from 'next/server';
import { ServerContainerBuilder } from '../../../../learneveryday/infrastructure/di/server-container';
import { ProcessTopicHistoryWorkflowCommand } from '@/learneveryday/application/commands/topic-history/ProcessTopicHistoryWorkflowCommand';

// Vercel function timeout protection (8 seconds to stay under 10s limit)
const MAX_EXECUTION_TIME_MS = 8000;

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Check if we're approaching the timeout limit
    if (Date.now() - startTime > MAX_EXECUTION_TIME_MS) {
      console.warn('Cron job approaching timeout limit, aborting');
      return NextResponse.json({ 
        success: false, 
        message: 'Execution timeout limit reached',
        executionTimeMs: Date.now() - startTime
      }, { status: 408 });
    }

    const container = ServerContainerBuilder.build();
    const processTopicHistoryWorkflowCommand = container.get<ProcessTopicHistoryWorkflowCommand>('ProcessTopicHistoryWorkflowCommand');

    // Pass configuration for Vercel compatibility
    await processTopicHistoryWorkflowCommand.execute({
      limit: 5, // Process fewer tasks per run
      maxExecutionTimeMs: MAX_EXECUTION_TIME_MS - 1000 // Leave 1 second buffer
    });
    
    const executionTime = Date.now() - startTime;
    console.log(`Cron job completed successfully in ${executionTime}ms`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Topic processing workflow executed successfully',
      executionTimeMs: executionTime
    }, { status: 200 });
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('Cron job execution failed:', error);
    
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : String(error),
      executionTimeMs: executionTime
    }, { status: 500 });
  }
}

// Also support POST for manual triggers
export async function POST() {
  return GET();
} 