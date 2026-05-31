import { GAS_API_URL } from './types';
import type { Condition, Property, RoutineDay } from './types';

async function gasGet(action: string, extra?: Record<string, string>): Promise<unknown> {
  if (!GAS_API_URL) throw new Error('GAS_URL not configured');
  const params = new URLSearchParams({ action, ...extra });
  const res = await fetch(`${GAS_API_URL}?${params.toString()}`, { redirect: 'follow' });
  return res.json();
}

// ===== 条件 =====
export async function apiGetConditions(): Promise<Condition[]> {
  const json = await gasGet('getConditions') as { data?: Condition[]; error?: string };
  if (json.error) throw new Error(json.error);
  return json.data ?? [];
}

export async function apiSaveConditions(rows: Condition[]): Promise<void> {
  const json = await gasGet('saveConditions', { body: JSON.stringify(rows) }) as { success?: boolean; error?: string };
  if (json.error) throw new Error(json.error);
}

// ===== 物件 =====
export async function apiGetProperties(): Promise<Property[]> {
  const json = await gasGet('getProperties') as { data?: Property[]; error?: string };
  if (json.error) throw new Error(json.error);
  return json.data ?? [];
}

export async function apiSaveProperties(properties: Property[]): Promise<void> {
  const json = await gasGet('saveProperties', { body: JSON.stringify(properties) }) as { success?: boolean; error?: string };
  if (json.error) throw new Error(json.error);
}

// ===== ルーティン =====
export async function apiGetRoutines(): Promise<RoutineDay[] | null> {
  const json = await gasGet('getRoutines') as { data?: RoutineDay[] | null; error?: string };
  if (json.error) throw new Error(json.error);
  return json.data ?? null;
}

export async function apiSaveRoutines(data: RoutineDay[]): Promise<void> {
  const json = await gasGet('saveRoutines', { body: JSON.stringify(data) }) as { success?: boolean; error?: string };
  if (json.error) throw new Error(json.error);
}
