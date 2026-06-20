import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import {
  PasswordEntry, SessionInfo, LogEntry,
  loadPasswords, savePasswords, loadLogs, addLog,
  loadSessions, saveSessions, registerCurrentSession, getCurrentSessionId,
  LOCK_DURATIONS, LockKey, getLockDuration, setLockDuration,
} from '@/lib/vault';

interface Props {
  onLogout: () => void;
}

const logIcon: Record<LogEntry['type'], string> = {
  login: 'LogIn', fail: 'AlertTriangle', '2fa': 'ShieldCheck', block: 'Lock',
  add: 'Plus', edit: 'Pencil', delete: 'Trash2', unlock: 'Unlock',
};

const Dashboard = ({ onLogout }: Props) => {
  const { toast } = useToast();
  const [tab, setTab] = useState<'vault' | 'security' | 'logs'>('vault');
  const [items, setItems] = useState<PasswordEntry[]>([]);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [lockKey, setLockKey] = useState<LockKey>(getLockDuration());
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PasswordEntry | null>(null);
  const [form, setForm] = useState({ title: '', login: '', password: '' });

  useEffect(() => {
    setItems(loadPasswords());
    setSessions(registerCurrentSession());
    setLogs(loadLogs());
  }, []);

  const refreshLogs = () => setLogs(loadLogs());

  // --- Пароли ---
  const openAdd = () => {
    setEditing(null);
    setForm({ title: '', login: '', password: '' });
    setDialogOpen(true);
  };

  const openEdit = (entry: PasswordEntry) => {
    setEditing(entry);
    setForm({ title: entry.title, login: entry.login || '', password: entry.password });
    setDialogOpen(true);
  };

  const saveEntry = () => {
    if (!form.title.trim() || !form.password.trim()) {
      toast({ title: 'Заполните название и пароль', variant: 'destructive' });
      return;
    }
    let next: PasswordEntry[];
    if (editing) {
      next = items.map((i) =>
        i.id === editing.id ? { ...i, title: form.title, login: form.login, password: form.password } : i
      );
      addLog('edit', `Изменён пароль: ${form.title}`);
    } else {
      next = [{ id: crypto.randomUUID(), title: form.title, login: form.login, password: form.password }, ...items];
      addLog('add', `Добавлен пароль: ${form.title}`);
    }
    setItems(next);
    savePasswords(next);
    setDialogOpen(false);
    refreshLogs();
    toast({ title: editing ? 'Пароль изменён' : 'Пароль добавлен' });
  };

  const deleteEntry = (entry: PasswordEntry) => {
    const next = items.filter((i) => i.id !== entry.id);
    setItems(next);
    savePasswords(next);
    addLog('delete', `Удалён пароль: ${entry.title}`);
    refreshLogs();
    toast({ title: 'Пароль удалён', variant: 'destructive' });
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Скопировано в буфер' });
  };

  // --- Блокировки ---
  const changeLockDuration = (key: LockKey) => {
    setLockKey(key);
    setLockDuration(key);
    toast({ title: `Длительность блокировки: ${LOCK_DURATIONS[key].label}` });
  };

  const toggleBlockSession = (id: string) => {
    const next = sessions.map((s) => (s.id === id && !s.current ? { ...s, blocked: !s.blocked } : s));
    setSessions(next);
    saveSessions(next);
    addLog('block', 'Изменён статус блокировки сессии');
    refreshLogs();
  };

  const blockAllOthers = () => {
    const next = sessions.map((s) => (s.current ? s : { ...s, blocked: true }));
    setSessions(next);
    saveSessions(next);
    addLog('block', 'Заблокированы все сессии кроме текущей');
    refreshLogs();
    toast({ title: 'Все чужие сессии заблокированы' });
  };

  const unlockAll = () => {
    const next = sessions.map((s) => ({ ...s, blocked: false }));
    setSessions(next);
    saveSessions(next);
    addLog('unlock', 'Сняты все блокировки сессий');
    refreshLogs();
    toast({ title: 'Все блокировки сняты' });
  };

  const cur = getCurrentSessionId();

  return (
    <div className="min-h-screen neon-grid">
      {/* Header */}
      <header className="glass sticky top-0 z-20 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-neon-cyan/10 glow-cyan">
              <Icon name="ShieldCheck" size={20} className="text-neon-cyan" />
            </div>
            <span className="font-display font-bold text-glow-cyan tracking-wider">NEON VAULT</span>
          </div>
          <Button variant="ghost" onClick={onLogout} className="text-muted-foreground hover:text-destructive">
            <Icon name="LogOut" size={18} className="mr-2" /> Выход
          </Button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="max-w-5xl mx-auto px-4 mt-6 flex gap-2 flex-wrap">
        {([
          ['vault', 'Пароли', 'KeyRound'],
          ['security', 'Безопасность', 'ShieldAlert'],
          ['logs', 'Журнал', 'ScrollText'],
        ] as const).map(([key, label, icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg font-display text-sm tracking-wide flex items-center gap-2 transition-all ${
              tab === key
                ? 'bg-neon-cyan/15 text-neon-cyan glow-cyan'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <Icon name={icon} size={16} /> {label}
          </button>
        ))}
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-6 animate-fade-in">
        {/* VAULT */}
        {tab === 'vault' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-bold tracking-wide">
                Сохранённые пароли <span className="text-muted-foreground text-base">({items.length})</span>
              </h2>
              <Button onClick={openAdd} className="bg-neon-magenta text-background hover:bg-neon-magenta/90 glow-magenta font-display">
                <Icon name="Plus" size={18} className="mr-1.5" /> Добавить
              </Button>
            </div>

            {items.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center text-muted-foreground">
                <Icon name="KeyRound" size={48} className="mx-auto mb-4 opacity-40" />
                <p>Пока нет сохранённых паролей</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {items.map((entry) => (
                  <div key={entry.id} className="glass rounded-xl p-4 flex items-start justify-between gap-3 hover:border-neon-cyan/40 transition-all animate-scale-in">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display font-semibold text-foreground truncate">{entry.title}</h3>
                      {entry.login && (
                        <p className="text-sm text-muted-foreground truncate flex items-center gap-1.5 mt-1">
                          <Icon name="User" size={13} /> {entry.login}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <code className="text-sm text-neon-cyan font-mono">
                          {revealed[entry.id] ? entry.password : '••••••••••'}
                        </code>
                        <button onClick={() => setRevealed((r) => ({ ...r, [entry.id]: !r[entry.id] }))} className="text-muted-foreground hover:text-neon-cyan">
                          <Icon name={revealed[entry.id] ? 'EyeOff' : 'Eye'} size={15} />
                        </button>
                        <button onClick={() => copy(entry.password)} className="text-muted-foreground hover:text-neon-cyan">
                          <Icon name="Copy" size={15} />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <button onClick={() => openEdit(entry)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-neon-cyan hover:bg-neon-cyan/10">
                        <Icon name="Pencil" size={16} />
                      </button>
                      <button onClick={() => deleteEntry(entry)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                        <Icon name="Trash2" size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SECURITY */}
        {tab === 'security' && (
          <div className="space-y-6">
            <div className="glass rounded-2xl p-6">
              <h2 className="font-display text-lg font-bold mb-1 flex items-center gap-2">
                <Icon name="Timer" size={20} className="text-neon-cyan" /> Длительность блокировки
              </h2>
              <p className="text-sm text-muted-foreground mb-4">При неверном вводе логина, пароля или 2FA</p>
              <div className="flex gap-3 flex-wrap">
                {(Object.keys(LOCK_DURATIONS) as LockKey[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => changeLockDuration(key)}
                    className={`px-5 py-3 rounded-xl font-display text-sm tracking-wide transition-all ${
                      lockKey === key
                        ? 'bg-neon-cyan/15 text-neon-cyan glow-cyan border border-neon-cyan/40'
                        : 'bg-muted/40 text-muted-foreground hover:text-foreground border border-transparent'
                    }`}
                  >
                    {LOCK_DURATIONS[key].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <h2 className="font-display text-lg font-bold flex items-center gap-2">
                  <Icon name="MonitorSmartphone" size={20} className="text-neon-magenta" /> Сессии доступа
                </h2>
                <div className="flex gap-2">
                  <Button onClick={blockAllOthers} variant="outline" size="sm" className="border-destructive/40 text-destructive hover:bg-destructive/10">
                    <Icon name="Lock" size={15} className="mr-1.5" /> Заблокировать всех
                  </Button>
                  <Button onClick={unlockAll} variant="outline" size="sm" className="border-neon-green/40 text-neon-green hover:bg-neon-green/10">
                    <Icon name="Unlock" size={15} className="mr-1.5" /> Снять все
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                {sessions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                    <div className="flex items-center gap-3">
                      <Icon name={s.device.includes('Мобиль') ? 'Smartphone' : 'Monitor'} size={20} className="text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm flex items-center gap-2">
                          {s.device}
                          {s.id === cur && <span className="text-xs px-2 py-0.5 rounded-full bg-neon-cyan/15 text-neon-cyan">Текущая</span>}
                          {s.blocked && <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/15 text-destructive">Заблокирована</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">{new Date(s.createdAt).toLocaleString('ru-RU')}</p>
                      </div>
                    </div>
                    {s.id !== cur && (
                      <button onClick={() => toggleBlockSession(s.id)} className={`text-sm hover:underline ${s.blocked ? 'text-neon-green' : 'text-destructive'}`}>
                        {s.blocked ? 'Разблокировать' : 'Заблокировать'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* LOGS */}
        {tab === 'logs' && (
          <div className="glass rounded-2xl p-6">
            <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
              <Icon name="ScrollText" size={20} className="text-neon-cyan" /> Журнал событий
            </h2>
            {logs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Событий пока нет</p>
            ) : (
              <div className="space-y-1.5">
                {logs.map((l) => (
                  <div key={l.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/30 text-sm">
                    <Icon
                      name={logIcon[l.type]}
                      size={16}
                      className={l.type === 'fail' || l.type === 'block' || l.type === 'delete' ? 'text-destructive' : 'text-neon-cyan'}
                    />
                    <span className="flex-1">{l.message}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{new Date(l.time).toLocaleString('ru-RU')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Dialog добавления/изменения */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass border-neon-cyan/30">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wide flex items-center gap-2">
              <Icon name={editing ? 'Pencil' : 'Plus'} size={20} className="text-neon-cyan" />
              {editing ? 'Изменить пароль' : 'Новый пароль'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm">Название <span className="text-destructive">*</span></Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Например: Gmail" className="mt-1.5 bg-input/60" />
            </div>
            <div>
              <Label className="text-sm">Логин <span className="text-muted-foreground">(необязательно)</span></Label>
              <Input value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} placeholder="user@mail.com" className="mt-1.5 bg-input/60" />
            </div>
            <div>
              <Label className="text-sm">Пароль <span className="text-destructive">*</span></Label>
              <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" className="mt-1.5 bg-input/60" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Отменить</Button>
            <Button onClick={saveEntry} className="bg-neon-cyan text-background hover:bg-neon-cyan/90 glow-cyan font-display">
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
