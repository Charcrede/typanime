'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function AuthCallbackContent() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token');

  useEffect(() => {
    if (!token) return;

    // fetch(`${process.env.NEXT_PUBLIC_API}auth/set-cookie`, {
    //   method: 'POST',
    //   credentials: 'include', // 🔥 OBLIGATOIRE
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({ token }),
    // })
      // .then(() => {
        // router.replace('/dashboard');
      // })
      // .catch(() => {
        // router.replace('/login');
      // });
       router.replace('/dashboard');
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400 text-sm">Connexion en cours…</p>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <AuthCallbackContent />
    </Suspense>
  );
}