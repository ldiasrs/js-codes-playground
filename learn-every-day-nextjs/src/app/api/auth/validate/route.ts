import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { JwtConfiguration } from '../../../../learneveryday/infrastructure/config/jwt.config';

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header or cookie
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7)
      : request.cookies.get('authToken')?.value;

    if (!token) {
      return NextResponse.json({
        success: false,
        isAuthenticated: false,
        message: 'No token provided'
      }, { status: 401 });
    }

    // Get JWT configuration
    const jwtConfig = JwtConfiguration.getInstance().getConfig();
    
    // Verify token
    const secret = new TextEncoder().encode(jwtConfig.secret);
    const { payload } = await jwtVerify(token, secret, {
      issuer: jwtConfig.issuer,
      algorithms: [jwtConfig.algorithm],
    });

    // Token is valid, return user information
    return NextResponse.json({
      success: true,
      isAuthenticated: true,
      customerId: payload.sub || '',
      email: payload.email || '',
      message: 'Token is valid'
    });

  } catch (error) {
    console.warn('Token validation failed:', error);
    return NextResponse.json({
      success: false,
      isAuthenticated: false,
      message: 'Invalid or expired token'
    }, { status: 401 });
  }
} 