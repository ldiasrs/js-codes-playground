import { NextRequest, NextResponse } from 'next/server';
import { ContainerBuilder } from '../../../../learneveryday/infrastructure/di/nextjs-container';
import { VerifyCustomerCommand } from '../../../../learneveryday/application/commands/customer/VerifyCustomerCommand';

export async function POST(request: NextRequest) {
  try {
    const { email, verificationCode } = await request.json();

    console.log('Verify API request received:', { email, verificationCode });
    if (!email || !verificationCode) {
      return NextResponse.json(
        { success: false, message: 'Email and verification code are required' },
        { status: 400 }
      );
    }

    const container = ContainerBuilder.build();
    const verifyCommand = container.createInstance('VerifyCustomerCommand', { 
      email, 
      verificationCode 
    }) as VerifyCustomerCommand;
    const result = await verifyCommand.execute();

    if (result.success && result.customer && result.token) {
      // Convert CustomerDTO to UserData format
      const userData = {
        id: result.customer.id,
        email: result.customer.email,
        name: result.customer.customerName,
        createdAt: result.customer.dateCreated.toISOString(),
      };

      return NextResponse.json({
        success: true,
        message: result.message,
        user: userData,
        token: result.token
      });
    } else {
      return NextResponse.json({
        success: false,
        message: result.message
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Verify API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 