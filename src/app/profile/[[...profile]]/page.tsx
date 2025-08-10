import { UserProfile } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-4xl space-y-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Profile Settings</CardTitle>
            <CardDescription>
              Manage your account settings and personal information
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <UserProfile 
              path="/profile"
              routing="path"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "border-0 shadow-none",
                }
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
