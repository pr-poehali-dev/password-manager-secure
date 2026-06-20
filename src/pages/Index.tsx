import { useEffect, useState } from 'react';
import AuthScreen from '@/components/AuthScreen';
import LockScreen from '@/components/LockScreen';
import Dashboard from '@/components/Dashboard';
import { isLocked, clearLock } from '@/lib/vault';

type View = 'auth' | 'locked' | 'dashboard';

const Index = () => {
  const [view, setView] = useState<View>(() => (isLocked() ? 'locked' : 'auth'));

  useEffect(() => {
    if (isLocked()) setView('locked');
  }, []);

  return (
    <>
      {view === 'locked' && (
        <LockScreen
          onExpire={() => {
            clearLock();
            setView('auth');
          }}
        />
      )}
      {view === 'auth' && (
        <AuthScreen
          onLocked={() => setView('locked')}
          onSuccess={() => setView('dashboard')}
        />
      )}
      {view === 'dashboard' && <Dashboard onLogout={() => setView('auth')} />}
    </>
  );
};

export default Index;
