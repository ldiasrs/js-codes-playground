import { NextRequest, NextResponse } from 'next/server';
import { ServerContainerBuilder } from '../../../../learneveryday/infrastructure/di/server-container';
import { CreateCustomerCommand, CreateCustomerCommandData } from '../../../../learneveryday/application/commands/customer/CreateCustomerCommand';

export async function POST(request: NextRequest) {
  try {
    const body: CreateCustomerCommandData = await request.json();
    
    // Validate required fields
    const { customerName, govIdentification, email, phoneNumber } = body;
    
    if (!customerName?.trim()) {
      return NextResponse.json(
        { error: 'Customer name is required' },
        { status: 400 }
      );
    }
    
    // Government identification is optional, but if content is provided, type must be provided too
    if (govIdentification?.content?.trim() && !govIdentification?.type) {
      return NextResponse.json(
        { error: 'Government identification type is required when content is provided' },
        { status: 400 }
      );
    }
    
    if (!email?.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    if (!phoneNumber?.trim()) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Get server container and create command
    const container = ServerContainerBuilder.build();
    const createCustomerCommand = container.get<CreateCustomerCommand>('CreateCustomerCommand');
    
    // Execute the command
    const customerDTO = await createCustomerCommand.execute(body);
    
    return NextResponse.json(
      { 
        message: 'Customer registered successfully',
        customer: customerDTO 
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific domain errors
    if (error instanceof Error) {
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        return NextResponse.json(
          { error: 'A customer with this email or identification already exists' },
          { status: 409 }
        );
      }
      
      if (error.message.includes('invalid') || error.message.includes('validation')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 