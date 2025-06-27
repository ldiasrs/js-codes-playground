import { NextRequest, NextResponse } from 'next/server';
import { ContainerBuilder } from '../../../learneveryday/infrastructure/di/nextjs-container';
import { GetAllTopicsQuery } from '../../../learneveryday/application/queries/topic/GetAllTopicsQuery';
import { AddTopicCommand } from '../../../learneveryday/application/commands/topic/AddTopicCommand';

export async function GET(request: NextRequest) {
  try {
    // Get customer ID from query parameters or headers
    const customerId = request.nextUrl.searchParams.get('customerId');
    
    // if (!customerId) {
    //   return NextResponse.json(
    //     { success: false, message: 'Customer ID is required' },
    //     { status: 400 }
    //   );
    // }

    const container = ContainerBuilder.build();
    const query = container.createInstance<GetAllTopicsQuery>('GetAllTopicsQuery', {
      customerId
    });
    
    const topics = await query.execute();

    return NextResponse.json({
      success: true,
      message: 'Topics retrieved successfully',
      topics
    });
  } catch (error) {
    console.error('Get all topics API error:', error);
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

    const container = ContainerBuilder.build();
    const command = container.createInstance<AddTopicCommand>('AddTopicCommand', {
      customerId,
      subject: subject.trim()
    });
    
    const topic = await command.execute();

    return NextResponse.json({
      success: true,
      message: 'Topic created successfully',
      topic
    });
  } catch (error) {
    console.error('Create topic API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 