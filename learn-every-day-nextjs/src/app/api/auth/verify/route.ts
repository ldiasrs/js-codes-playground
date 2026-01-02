import { NextRequest, NextResponse } from 'next/server';
import { ServerContainerBuilder } from '../../../../learneveryday/infrastructure/di/server-container';
import { VerifyAuthCodeFeature } from '../../../../learneveryday/features/auth/application/use-cases/VerifyAuthCodeFeature';

export async function POST(request: NextRequest) {
  try {
    const {  verificationCode } = await request.json();

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    if (!customerId || !verificationCode) {
      return NextResponse.json(
        { success: false, message: 'CustomerId and verification code are required' },
        { status: 400 }
      );
    }

    const container = ServerContainerBuilder.build();
    const verifyAuthCodeFeature = container.get<VerifyAuthCodeFeature>('VerifyAuthCodeFeature');
    const result = await verifyAuthCodeFeature.execute({ 
      customerId, 
      verificationCode 
    });

    if (result.success && result.customerId && result.token) {

      // Create response with secure cookie
      const response = NextResponse.json({
        success: true,
        message: result.message,
        customerId: result.customerId,
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