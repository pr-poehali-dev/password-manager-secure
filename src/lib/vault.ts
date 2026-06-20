// Простое клиентское "шифрование" (XOR + base64) для демо-хранения в браузере.
// Не криптостойко, но скрывает данные от случайного просмотра в localStorage.

const SECRET_KEY = 'NEON_VAULT_9501637';

function xorCrypt(text: string): string {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    out += String.fromCharCode(
      text.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length)
    );
  }
  return out;
}

export function encrypt(data: unknown): string {
  try {
    const json = JSON.stringify(data);
    return btoa(unescape(encodeURIComponent(xorCrypt(json))));
  } catch {
    return '';
  }
}

export function decrypt<T>(cipher: string, fallback: T): T {
  try {
    const json = xorCrypt(decodeURIComponent(escape(atob(cipher))));
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

export interface PasswordEntry {
  id: string;
  title: string;
  login?: string;
  password: string;
}

export interface SessionInfo {
  id: string;
  device: string;
  createdAt: number;
  current: boolean;
  blocked: boolean;
}

export interface LogEntry {
  id: string;
  time: number;
  type: 'login' | 'fail' | '2fa' | 'block' | 'add' | 'edit' | 'delete' | 'unlock';
  message: string;
}

const KEYS = {
  passwords: 'nv_passwords',
  sessions: 'nv_sessions',
  logs: 'nv_logs',
  lockUntil: 'nv_lock_until',
  lockDuration: 'nv_lock_duration',
  sessionId: 'nv_current_session',
};

// --- Пароли ---
export const loadPasswords = (): PasswordEntry[] =>
  decrypt<PasswordEntry[]>(localStorage.getItem(KEYS.passwords) || '', []);

export const savePasswords = (items: PasswordEntry[]) =>
  localStorage.setItem(KEYS.passwords, encrypt(items));

// --- Логи ---
export const loadLogs = (): LogEntry[] =>
  decrypt<LogEntry[]>(localStorage.getItem(KEYS.logs) || '', []);

export const addLog = (type: LogEntry['type'], message: string) => {
  const logs = loadLogs();
  logs.unshift({ id: crypto.randomUUID(), time: Date.now(), type, message });
  localStorage.setItem(KEYS.logs, encrypt(logs.slice(0, 100)));
};

// --- Блокировка ---
export const LOCK_DURATIONS = {
  hour: { label: '1 час', ms: 60 * 60 * 1000 },
  day: { label: '24 часа', ms: 24 * 60 * 60 * 1000 },
  week: { label: '1 неделя', ms: 7 * 24 * 60 * 60 * 1000 },
} as const;

export type LockKey = keyof typeof LOCK_DURATIONS;

export const getLockDuration = (): LockKey =>
  (localStorage.getItem(KEYS.lockDuration) as LockKey) || 'day';

export const setLockDuration = (key: LockKey) =>
  localStorage.setItem(KEYS.lockDuration, key);

export const getLockUntil = (): number =>
  Number(localStorage.getItem(KEYS.lockUntil) || 0);

export const applyLock = () => {
  const dur = LOCK_DURATIONS[getLockDuration()].ms;
  const until = Date.now() + dur;
  localStorage.setItem(KEYS.lockUntil, String(until));
  addLog('block', `Сессия заблокирована на ${LOCK_DURATIONS[getLockDuration()].label}`);
  return until;
};

export const clearLock = () => localStorage.removeItem(KEYS.lockUntil);

export const isLocked = (): boolean => getLockUntil() > Date.now();

// --- Сессии ---
export const loadSessions = (): SessionInfo[] =>
  decrypt<SessionInfo[]>(localStorage.getItem(KEYS.sessions) || '', []);

export const saveSessions = (s: SessionInfo[]) =>
  localStorage.setItem(KEYS.sessions, encrypt(s));

export const getCurrentSessionId = (): string => {
  let id = localStorage.getItem(KEYS.sessionId);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEYS.sessionId, id);
  }
  return id;
};

export const registerCurrentSession = () => {
  const id = getCurrentSessionId();
  const sessions = loadSessions();
  if (!sessions.find((s) => s.id === id)) {
    sessions.unshift({
      id,
      device: navigator.userAgent.includes('Mobile') ? 'Мобильное устройство' : 'Компьютер',
      createdAt: Date.now(),
      current: true,
      blocked: false,
    });
  }
  const updated = sessions.map((s) => ({ ...s, current: s.id === id }));
  saveSessions(updated);
  return updated;
};
