import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { applyLock, addLog } from '@/lib/vault';

const VALID_LOGIN = 'Vxod_9501637Admin';
const VALID_PASSWORD = 'rz38)9ZquxKj@Ea';
const VALID_2FA = 'LIyXC8?*07ofd6Q';

interface Props {
  onLocked: () => void;
  onSuccess: () => void;
}

const AuthScreen = ({ onLocked, onSuccess }: Props) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [twoFa, setTwoFa] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const fail = (msg: string, log: string) => {
    addLog('fail', log);
    setError(msg);
    setShake(true);
    setTimeout(() => {
      applyLock();
      onLocked();
    }, 900);
  };

  const submitStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (login === VALID_LOGIN && password === VALID_PASSWORD) {
      addLog('login', 'Успешный ввод логина и пароля');
      setError('');
      setStep(2);
    } else {
      fail('Неверный логин или пароль. Блокировка...', 'Неверный логин или пароль');
    }
  };

  const submitStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (twoFa === VALID_2FA) {
      addLog('2fa', 'Успешная двухфакторная аутентификация');
      onSuccess();
    } else {
      fail('Неверный код 2FA. Блокировка...', 'Неверный код двухфакторной защиты');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center neon-grid relative overflow-hidden px-4">
      <div className="absolute top-1/4 -left-20 w-72 h-72 rounded-full bg-neon-cyan/20 blur-[100px]" />
      <div className="absolute bottom-1/4 -right-20 w-72 h-72 rounded-full bg-neon-magenta/20 blur-[100px]" />

      <div
        className={`glass rounded-2xl p-8 sm:p-10 max-w-md w-full relative z-10 animate-scale-in ${
          shake ? 'animate-shake border-destructive' : ''
        }`}
      >
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-xl flex items-center justify-center mb-4 bg-neon-cyan/10 glow-cyan">
            <Icon name={step === 1 ? 'KeyRound' : 'ShieldCheck'} size={32} className="text-neon-cyan" />
          </div>
          <h1 className="font-display text-2xl font-bold text-glow-cyan tracking-wider">
            NEON VAULT
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            {step === 1 ? 'Авторизация в системе' : 'Двухфакторная защита'}
          </p>
        </div>

        <div className="flex items-center gap-2 mb-8 justify-center">
          <span className={`h-1.5 w-12 rounded-full transition-all ${step >= 1 ? 'bg-neon-cyan glow-cyan' : 'bg-muted'}`} />
          <span className={`h-1.5 w-12 rounded-full transition-all ${step >= 2 ? 'bg-neon-magenta glow-magenta' : 'bg-muted'}`} />
        </div>

        {step === 1 ? (
          <form onSubmit={submitStep1} className="space-y-4">
            <div className="relative">
              <Icon name="User" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Логин"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                className="pl-10 h-12 bg-input/60 border-border focus-visible:ring-neon-cyan"
                autoFocus
              />
            </div>
            <div className="relative">
              <Icon name="Lock" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type={showPass ? 'text' : 'password'}
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-12 bg-input/60 border-border focus-visible:ring-neon-cyan"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-neon-cyan"
              >
                <Icon name={showPass ? 'EyeOff' : 'Eye'} size={18} />
              </button>
            </div>
            {error && <p className="text-destructive text-sm flex items-center gap-2"><Icon name="AlertTriangle" size={16} />{error}</p>}
            <Button type="submit" className="w-full h-12 font-display tracking-wider bg-neon-cyan text-background hover:bg-neon-cyan/90 glow-cyan">
              ВОЙТИ
            </Button>
            <p className="text-xs text-center text-muted-foreground/70 flex items-center justify-center gap-1.5">
              <Icon name="ShieldAlert" size={13} /> Одна попытка. При ошибке — блокировка.
            </p>
          </form>
        ) : (
          <form onSubmit={submitStep2} className="space-y-4">
            <div className="relative">
              <Icon name="KeySquare" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Код двухфакторной защиты"
                value={twoFa}
                onChange={(e) => setTwoFa(e.target.value)}
                className="pl-10 h-12 bg-input/60 border-border focus-visible:ring-neon-magenta"
                autoFocus
              />
            </div>
            {error && <p className="text-destructive text-sm flex items-center gap-2"><Icon name="AlertTriangle" size={16} />{error}</p>}
            <Button type="submit" className="w-full h-12 font-display tracking-wider bg-neon-magenta text-background hover:bg-neon-magenta/90 glow-magenta">
              ПОДТВЕРДИТЬ
            </Button>
            <p className="text-xs text-center text-muted-foreground/70 flex items-center justify-center gap-1.5">
              <Icon name="ShieldAlert" size={13} /> При ошибке вход начнётся заново.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthScreen;
