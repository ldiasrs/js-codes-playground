import { NextRequest, NextResponse } from 'next/server';
import { ServerContainerBuilder } from '../../../learneveryday/infrastructure/di/server-container';
import { GetAllTopicsQuery } from '../../../learneveryday/application/queries/topic/GetAllTopicsQuery';
import { AddTopicCommand } from '../../../learneveryday/application/commands/topic/AddTopicCommand';

export async function GET(request: NextRequest) {
  try {
    // Get customer ID from query parameters or headers
    const customerId = request.nextUrl.searchParams.get('customerId');
    
    if (!customerId) {
      return NextResponse.json(
        { success: false, message: 'Customer ID is required' },
        { status: 400 }
      );
    }

    const container = ServerContainerBuilder.build();
    const query = container.get<GetAllTopicsQuery>('GetAllTopicsQuery');
    
    const topics = await query.execute({ customerId });

    return NextResponse.json({
      success: true,
      message: 'Topics retrieved successfully',
      topics
    });
  } catch (error) {
    console.error('Get all topics API error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal server error' },
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