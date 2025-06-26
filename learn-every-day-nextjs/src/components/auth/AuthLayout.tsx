import React from 'react';
import { Card } from '../ui/Card';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
      
      <div className="w-full max-w-md relative z-10">
        <Card className="text-center border-primary/20">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-3 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {title}
            </h1>
            {subtitle && (
              <p className="text-muted-foreground leading-relaxed">{subtitle}</p>
            )}
          </div>
          {children}
        </Card>
      </div>
    </div>
  );
}; 