import { NextRequest, NextResponse } from 'next/server';
import { ServerContainerBuilder } from '../../../../learneveryday/infrastructure/di/server-container';
import { LoginFeature } from '../../../../learneveryday/features/auth/application/use-cases/LoginFeature';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    const container = ServerContainerBuilder.build();
    const loginFeature = container.get<LoginFeature>('LoginFeature');
    const result = await loginFeature.execute({ email });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        customerId: result.customerId,
        requiresVerification: true
      });
    } else {
      return NextResponse.json({
        success: false,
        message: result.message
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 