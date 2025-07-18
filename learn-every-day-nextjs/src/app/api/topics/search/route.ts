import { NextRequest, NextResponse } from 'next/server';
import { ServerContainerBuilder } from '../../../../learneveryday/infrastructure/di/server-container';
import { SearchTopicsQuery } from '../../../../learneveryday/application/queries/topic/SearchTopicsQuery';

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
    const searchQuery = container.get<SearchTopicsQuery>('SearchTopicsQuery');
    
    const topics = await searchQuery.execute({
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