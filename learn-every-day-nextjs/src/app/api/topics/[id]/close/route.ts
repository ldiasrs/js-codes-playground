import { NextRequest, NextResponse } from 'next/server';
import { ServerContainerBuilder } from '../../../../../learneveryday/infrastructure/di/server-container';
import { CloseTopicCommand } from '../../../../../learneveryday/application/commands/topic/CloseTopicCommand';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Topic ID is required' },
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
    const command = container.get<CloseTopicCommand>('CloseTopicCommand');
    
    const topic = await command.execute({ id });

    return NextResponse.json({
      success: true,
      message: 'Topic closed successfully',
      topic
    });
  } catch (error) {
    console.error('Close topic API error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
} 