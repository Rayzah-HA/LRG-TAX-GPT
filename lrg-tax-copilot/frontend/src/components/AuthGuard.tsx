'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, isFirmOwner } from '@/lib/auth';

interface AuthGuardProps {
  children: React.ReactNode;
  requireFirmOwner?: boolean;
}

export default function AuthGuard({ children, requireFirmOwner = false }: AuthGuardProps) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }

    if (requireFirmOwner && !isFirmOwner()) {
      router.replace('/');
      return;
    }

    setAuthorized(true);
    setChecking(false);
  }, [router, requireFirmOwner]);

  if (checking || !authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Verifying access...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
