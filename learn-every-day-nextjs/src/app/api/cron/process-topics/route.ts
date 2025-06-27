import { NextResponse } from 'next/server';
import { ServerContainerBuilder } from '../../../../learneveryday/infrastructure/di/server-container';

export async function GET() {
  try {
    const container = ServerContainerBuilder.build();
    const cronScheduler = container.getCronScheduler();
    
    if (cronScheduler) {
      await cronScheduler.triggerNow();
      return NextResponse.json({ 
        success: true, 
        message: 'Topic processing workflow executed successfully',
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json({ 
      success: false, 
      message: 'Cron scheduler not available' 
    }, { status: 500 });
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