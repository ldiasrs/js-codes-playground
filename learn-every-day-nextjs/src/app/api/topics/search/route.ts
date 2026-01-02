import { NextRequest, NextResponse } from 'next/server';
import { ServerContainerBuilder } from '../../../../learneveryday/infrastructure/di/server-container';
import { SearchTopicsFeature } from '../../../../learneveryday/features/topic/application/use-cases/SearchTopicsFeature';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const customerId = searchParams.get('customerId');

    if (!query) {
      return NextResponse.json(
        { success: false, message: 'Search query is required' },
        { status: 400 }
      );
    }

    if (!customerId) {
      return NextResponse.json(
        { success: false, message: 'Customer ID is required' },
        { status: 400 }
      );
    }

    const container = ServerContainerBuilder.build();
    const searchTopicsFeature = container.get<SearchTopicsFeature>('SearchTopicsFeature');
    
    const topics = await searchTopicsFeature.execute({
      criteria: {
        subject: query.trim(),
        customerId
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Topics search completed successfully',
      topics
    });
  } catch (error) {
    console.error('Search topics API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 