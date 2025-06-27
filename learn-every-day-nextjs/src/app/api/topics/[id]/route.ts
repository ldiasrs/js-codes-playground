import { NextRequest, NextResponse } from 'next/server';
import { ContainerBuilder } from '../../../../learneveryday/infrastructure/di/nextjs-container';
import { GetTopicByIdQuery } from '../../../../learneveryday/application/queries/topic/GetTopicByIdQuery';
import { UpdateTopicCommand } from '../../../../learneveryday/application/commands/topic/UpdateTopicCommand';
import { DeleteTopicCommand } from '../../../../learneveryday/application/commands/topic/DeleteTopicCommand';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Topic ID is required' },
        { status: 400 }
      );
    }

    const container = ContainerBuilder.build();
    const query = container.createInstance<GetTopicByIdQuery>('GetTopicByIdQuery', {
      id
    });
    
    const topic = await query.execute();

    if (!topic) {
      return NextResponse.json(
        { success: false, message: 'Topic not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Topic retrieved successfully',
      topic
    });
  } catch (error) {
    console.error('Get topic by ID API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { subject } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Topic ID is required' },
        { status: 400 }
      );
    }

    if (!subject) {
      return NextResponse.json(
        { success: false, message: 'Subject is required' },
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
    const command = container.createInstance<UpdateTopicCommand>('UpdateTopicCommand', {
      id,
      subject: subject.trim()
    });
    
    const topic = await command.execute();

    return NextResponse.json({
      success: true,
      message: 'Topic updated successfully',
      topic
    });
  } catch (error) {
    console.error('Update topic API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Topic ID is required' },
        { status: 400 }
      );
    }

    const container = ContainerBuilder.build();
    const command = container.createInstance<DeleteTopicCommand>('DeleteTopicCommand', {
      id
    });
    
    await command.execute();

    return NextResponse.json({
      success: true,
      message: 'Topic deleted successfully'
    });
  } catch (error) {
    console.error('Delete topic API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 