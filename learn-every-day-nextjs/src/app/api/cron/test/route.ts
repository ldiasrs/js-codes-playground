import { NextResponse } from 'next/server';
import { ServerContainerBuilder } from '../../../../learneveryday/infrastructure/di/server-container';

export async function GET() {
  try {
    const container = ServerContainerBuilder.build();
    const cronScheduler = container.getCronScheduler();
    
    if (!cronScheduler) {
      return NextResponse.json({ 
        success: false, 
        message: 'Cron scheduler not available in serverless environment' 
      }, { status: 500 });
    }

    // Get status without executing
    const status = cronScheduler.getStatus();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Cron scheduler status retrieved',
      status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to get cron status:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 