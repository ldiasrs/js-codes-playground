'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function LendingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
      
      <div className="w-full max-w-2xl relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-foreground mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Welcome to Learn Every Day
          </h1>
          <p className="text-xl text-muted-foreground max-w-md mx-auto leading-relaxed">
            Your personal learning journey starts here. Choose how you&apos;d like to get started.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Login Card */}
          <Card className="text-center hover:shadow-2xl transition-all duration-300 hover:scale-105 border-primary/20 hover:border-primary/40">
            <div className="mb-8">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20">
                <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">Sign In</h2>
              <p className="text-muted-foreground leading-relaxed">
                Already have an account? Sign in with your email address.
              </p>
            </div>
            <Button
              onClick={() => router.push('/auth/login')}
              className="w-full"
              size="lg"
            >
              Sign In
            </Button>
          </Card>

          {/* Register Card */}
          <Card className="text-center hover:shadow-2xl transition-all duration-300 hover:scale-105 border-secondary/20 hover:border-secondary/40">
            <div className="mb-8">
              <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-secondary/20">
                <svg className="w-10 h-10 text-secondary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">Create Account</h2>
              <p className="text-muted-foreground leading-relaxed">
                New to Learn Every Day? Create your account to get started.
              </p>
            </div>
            <Button
              onClick={() => router.push('/auth/register')}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Create Account
            </Button>
          </Card>
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            By continuing, you agree to our{' '}
            <a href="#" className="text-primary hover:text-primary/80 transition-colors duration-200 underline underline-offset-2">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-primary hover:text-primary/80 transition-colors duration-200 underline underline-offset-2">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
} 