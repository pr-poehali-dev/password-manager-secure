import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { getLockUntil } from '@/lib/vault';

const format = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

interface Props {
  onExpire: () => void;
}

const LockScreen = ({ onExpire }: Props) => {
  const [remaining, setRemaining] = useState(getLockUntil() - Date.now());

  useEffect(() => {
    const t = setInterval(() => {
      const left = getLockUntil() - Date.now();
      setRemaining(left);
      if (left <= 0) {
        clearInterval(t);
        onExpire();
      }
    }, 1000);
    return () => clearInterval(t);
  }, [onExpire]);

  return (
    <div className="min-h-screen flex items-center justify-center neon-grid relative overflow-hidden px-4">
      <div className="absolute inset-0 bg-gradient-to-b from-destructive/10 via-transparent to-destructive/10" />
      <div className="glass rounded-2xl p-8 sm:p-12 max-w-md w-full text-center relative z-10 animate-scale-in border-destructive/40">
        <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-destructive/15 animate-glow-pulse">
          <Icon name="ShieldAlert" size={44} className="text-destructive" />
        </div>
        <h1 className="font-display text-2xl font-bold text-destructive mb-2 tracking-wider">
          ДОСТУП ЗАБЛОКИРОВАН
        </h1>
        <p className="text-muted-foreground text-sm mb-8">
          Превышено количество попыток входа. Система заблокирована.
        </p>
        <div className="font-display text-5xl font-black text-destructive tabular-nums tracking-widest mb-3">
          {format(remaining)}
        </div>
        <p className="text-xs text-muted-foreground uppercase tracking-[0.3em]">
          до разблокировки
        </p>
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Icon name="Lock" size={14} />
          <span>Обновление страницы не сбросит таймер</span>
        </div>
      </div>
    </div>
  );
};

export default LockScreen;
