import { NextRequest, NextResponse } from 'next/server';
import { ServerContainerBuilder } from '../../../learneveryday/infrastructure/di/server-container';
import { GetAllTopicsQuery } from '../../../learneveryday/application/queries/topic/GetAllTopicsQuery';
import { AddTopicCommand } from '../../../learneveryday/application/commands/topic/AddTopicCommand';

export async function GET(request: NextRequest) {
  try {
    // Get customerId from query parameters
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { success: false, message: 'Customer ID is required' },
        { status: 400 }
      );
    }

    console.log('Topics API request for customer:', customerId);

    const container = ServerContainerBuilder.build();
    const getAllTopicsQuery = container.get<GetAllTopicsQuery>('GetAllTopicsQuery');
    
    const topics = await getAllTopicsQuery.execute({ customerId });

    return NextResponse.json({
      success: true,
      topics,
      customerId
    });
  } catch (error) {
    console.error('Topics API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { customerId, subject } = await request.json();

    if (!customerId || !subject) {
      return NextResponse.json(
        { success: false, message: 'Customer ID and subject are required' },
        { status: 400 }
      );
    }

    if (typeof subject !== 'string' || subject.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Subject must be a non-empty string' },
        { status: 400 }
      );
    }

    const container = ServerContainerBuilder.build();
    const command = container.get<AddTopicCommand>('AddTopicCommand');
    
    const topic = await command.execute({
      customerId,
      subject: subject.trim()
    });

    return NextResponse.json({
      success: true,
      message: 'Topic created successfully',
      topic
    });
  } catch (error) {
    console.error('Create topic API error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
} 