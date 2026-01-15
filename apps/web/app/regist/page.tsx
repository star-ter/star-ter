'use client';

import { useRouter } from 'next/navigation';

import { RegisterPage } from '@/components/RegisterPage';

export default function Page() {
  const router = useRouter();

  return <RegisterPage onRegister={() => router.push('/login')} />;
}
