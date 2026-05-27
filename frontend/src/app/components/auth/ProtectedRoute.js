'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const ProtectedRoute = ({ children }) => {
  const router = useRouter();
  let token = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('token');
  }

  useEffect(() => {
    if (!token) {
      router.push('/login');
    }
  }, [router, token]);

  if (!token) {
    return <div>Loading...</div>;
  }

  return children;
};

export default ProtectedRoute;
