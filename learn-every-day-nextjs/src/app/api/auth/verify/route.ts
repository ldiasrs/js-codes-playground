import { NextRequest, NextResponse } from 'next/server';
import { ServerContainerBuilder } from '../../../../learneveryday/infrastructure/di/server-container';
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

    const container = ServerContainerBuilder.build();
    const verifyCommand = container.get<VerifyCustomerCommand>('VerifyCustomerCommand');
    const result = await verifyCommand.execute({ 
      email, 
      verificationCode 
    });

    if (result.success && result.customer && result.token) {

      // Create response with secure cookie
      const response = NextResponse.json({
        success: true,
        message: result.message,
        customerId: result.customer.id,
        token: result.token
      });

      // Set secure HTTP-only cookie for better security
      response.cookies.set('authToken', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 86400, // 24 hours
        path: '/'
      });

      return response;
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