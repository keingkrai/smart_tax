'use client';

import { createContext, useState, useContext, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // ✅ ใช้ได้กับไฟล์ .js
  const idleTimer = useRef(null);

  // 15 นาที (900000 ms)
  const IDLE_TIMEOUT = 15 * 60 * 1000;

  const resetIdleTimer = () => {
    if (idleTimer.current) window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => {
      console.log("AuthContext: idle timeout reached → logout");
      logout();
    }, IDLE_TIMEOUT);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        setUser(JSON.parse(token));
      } catch {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);

    // ฟัง event user activity
    window.addEventListener('mousemove', resetIdleTimer);
    window.addEventListener('keydown', resetIdleTimer);
    window.addEventListener('click', resetIdleTimer);

    resetIdleTimer(); // เริ่มจับเวลา

    return () => {
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
      window.removeEventListener('mousemove', resetIdleTimer);
      window.removeEventListener('keydown', resetIdleTimer);
      window.removeEventListener('click', resetIdleTimer);
    };
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    if (idleTimer.current) window.clearTimeout(idleTimer.current);
    router.push('/login');
  };

  const login = (employeeObj) => {
    localStorage.setItem('token', JSON.stringify(employeeObj));
    setUser(employeeObj);
    resetIdleTimer();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
