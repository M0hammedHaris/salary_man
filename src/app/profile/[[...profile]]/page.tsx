import { UserProfile } from '@clerk/nextjs';

export default function ProfilePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-4xl">
        <UserProfile 
          path="/profile"
          routing="path"
        />
      </div>
    </div>
  );
}
