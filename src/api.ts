import { GAS_API_URL } from './types';
import type { Condition } from './types';

async function gasGet(action: string): Promise<unknown> {
  if (!GAS_API_URL) throw new Error('GAS_URL not configured');
  const res = await fetch(`${GAS_API_URL}?action=${action}`, { redirect: 'follow' });
  return res.json();
}

export async function apiGetConditions(): Promise<Condition[]> {
  const json = await gasGet('getConditions') as { data?: Condition[]; error?: string };
  if (json.error) throw new Error(json.error);
  return json.data ?? [];
}

export async function apiSaveConditions(rows: Condition[]): Promise<void> {
  if (!GAS_API_URL) throw new Error('GAS_URL not configured');
  const url = `${GAS_API_URL}?action=saveConditions&body=${encodeURIComponent(JSON.stringify(rows))}`;
  const res = await fetch(url, { redirect: 'follow' });
  const json = await res.json() as { success?: boolean; error?: string };
  if (json.error) throw new Error(json.error);
}
