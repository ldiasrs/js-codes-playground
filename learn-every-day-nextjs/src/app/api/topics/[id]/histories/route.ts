import { NextRequest, NextResponse } from 'next/server';
import { ServerContainerBuilder } from '../../../../../learneveryday/infrastructure/di/server-container';
import { GetTopicHistoriesFeature } from '../../../../../learneveryday/features/topic-histoy/application/use-cases/close-topic/GetTopicHistoriesFeature';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Topic ID is required' },
        { status: 400 }
      );
    }

    console.log('Topic histories API request for topic:', id);

    const container = ServerContainerBuilder.build();
    const getTopicHistoriesFeature = container.get<GetTopicHistoriesFeature>('GetTopicHistoriesFeature');
    
    const topicHistories = await getTopicHistoriesFeature.execute({ topicId: id });

    return NextResponse.json({
      success: true,
      message: 'Topic histories retrieved successfully',
      topicHistories,
      topicId: id
    });
  } catch (error) {
    console.error('Get topic histories API error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
} 