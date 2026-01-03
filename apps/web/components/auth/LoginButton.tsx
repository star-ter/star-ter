import Link from 'next/link';
import { User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function LoginButton() {
  const { isLoggedIn } = useAuth();

  return (
    <Link
      href={isLoggedIn ? '/user' : '/login'}
      className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg ring-1 ring-gray-200 transition-colors hover:bg-white"
    >
      <User
        className={`h-6 w-6 ${isLoggedIn ? 'text-blue-600' : 'text-gray-700'}`}
      />
    </Link>
  );
}
