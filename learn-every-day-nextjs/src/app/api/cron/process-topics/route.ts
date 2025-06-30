import { NextResponse } from 'next/server';
import { ServerContainerBuilder } from '../../../../learneveryday/infrastructure/di/server-container';
import { ProcessTopicHistoryWorkflowCommand } from '@/learneveryday/application/commands/topic-history/ProcessTopicHistoryWorkflowCommand';

export async function GET() {
  try {
    const container = ServerContainerBuilder.build();
    const processTopicHistoryWorkflowCommand = container.get<ProcessTopicHistoryWorkflowCommand>('ProcessTopicHistoryWorkflowCommand');

    await processTopicHistoryWorkflowCommand.execute();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Topic processing workflow executed successfully' 
    }, { status: 200 });
  } catch (error) {
    console.error('Cron job execution failed:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// Also support POST for manual triggers
export async function POST() {
  return GET();
} 