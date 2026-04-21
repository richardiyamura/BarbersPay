import { api } from './api';

const QUEUE_KEY = 'bp_offline_cash';

export interface CashEntry {
  appointment_id?: number;
  amount: number;
  timestamp: number;
}

export function queueCash(entry: CashEntry) {
  const q = getQueue();
  q.push(entry);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

export function getQueue(): CashEntry[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

export async function syncQueue() {
  const q = getQueue();
  if (!q.length) return;
  const failed: CashEntry[] = [];
  for (const entry of q) {
    try {
      await api.post('/payments/cash', entry);
    } catch {
      failed.push(entry);
    }
  }
  localStorage.setItem(QUEUE_KEY, JSON.stringify(failed));
  return q.length - failed.length; // synced count
}
