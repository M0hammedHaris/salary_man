import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { DashboardUserButton } from '@/components/dashboard-user-button';

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">SalaryMan Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <DashboardUserButton />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to SalaryMan</h2>
          <p className="text-gray-600">
            Your secure personal finance management dashboard. Authentication is working successfully!
          </p>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900">Accounts</h3>
              <p className="text-blue-700 text-sm">Manage your bank accounts and credit cards</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900">Transactions</h3>
              <p className="text-green-700 text-sm">Track your income and expenses</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900">Goals</h3>
              <p className="text-purple-700 text-sm">Set and track your savings goals</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
