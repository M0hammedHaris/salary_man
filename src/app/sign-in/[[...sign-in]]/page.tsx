import { SignIn } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to your SalaryMan account to manage your finances securely
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <SignIn 
              path="/sign-in"
              routing="path"
              signUpUrl="/sign-up"
              redirectUrl="/dashboard"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "border-0 shadow-none",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                }
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
