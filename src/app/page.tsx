import { auth } from '@clerk/nextjs/server';
import { SignInButton, SignUpButton } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, TrendingUp, Target } from 'lucide-react';

export default async function Home() {
  const { userId } = await auth();

  // If user is authenticated, redirect to dashboard
  if (userId) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-background">
      {/* Header */}
      <header className="relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">SalaryMan</h1>
              <Badge variant="secondary">Beta</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <SignInButton mode="modal">
                <Button variant="ghost">Sign In</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button>Get Started</Button>
              </SignUpButton>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              Take Control of Your
              <span className="text-primary"> Financial Future</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Secure, intelligent personal finance management. Track expenses, manage accounts, 
              and achieve your financial goals with confidence.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <SignUpButton mode="redirect" forceRedirectUrl="/dashboard">
                <Button size="lg">Start Free Today</Button>
              </SignUpButton>
              <SignInButton mode="redirect" forceRedirectUrl="/dashboard">
                <Button variant="ghost" size="lg">
                  Sign in <span aria-hidden="true">→</span>
                </Button>
              </SignInButton>
            </div>
          </div>

          {/* Feature Grid */}
          <div className="mt-24">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                    <Shield className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-blue-600">Bank-Level Security</CardTitle>
                  <CardDescription>
                    Your financial data is protected with enterprise-grade encryption and security measures.
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle className="text-green-600">Smart Insights</CardTitle>
                  <CardDescription>
                    Get intelligent recommendations and insights to optimize your spending and savings.
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                    <Target className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-purple-600">Goal Tracking</CardTitle>
                  <CardDescription>
                    Set and track financial goals with visual progress indicators and smart milestones.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
