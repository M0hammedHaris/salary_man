import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { DashboardUserButton } from '@/components/dashboard-user-button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-foreground">SalaryMan Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <DashboardUserButton />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Welcome to SalaryMan
              <Badge variant="secondary">Active</Badge>
            </CardTitle>
            <CardDescription>
              Your secure personal finance management dashboard. Authentication is working successfully!
            </CardDescription>
          </CardHeader>
        </Card>
          
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-blue-600">Accounts</CardTitle>
              <CardDescription>Manage your bank accounts and credit cards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-foreground">0</span>
                <Badge variant="outline">Coming Soon</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-green-600">Transactions</CardTitle>
              <CardDescription>Track your income and expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-foreground">$0</span>
                <Badge variant="outline">Coming Soon</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-purple-600">Goals</CardTitle>
              <CardDescription>Set and track your savings goals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-foreground">0</span>
                <Badge variant="outline">Coming Soon</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
