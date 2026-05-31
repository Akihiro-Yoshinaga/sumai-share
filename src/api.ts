import { GAS_API_URL } from './types';
import type { Condition, Property, RoutineDay, Task } from './types';

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

// ===== Gemini画像解析 =====
export async function apiAnalyzePropertyImages(
  images: { base64: string; mimeType: string }[]
): Promise<{ name: string; rent: number; layout: string; sqm: number; address: string }> {
  const json = await gasGet('analyzePropertyImages', { body: JSON.stringify({ images }) }) as {
    data?: { name: string; rent: number; layout: string; sqm: number; address: string };
    error?: string;
  };
  if (json.error) throw new Error(json.error);
  return json.data!;
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

// ===== タスク =====
export async function apiGetTasks(): Promise<Task[] | null> {
  const json = await gasGet('getTasks') as { data?: Task[] | null; error?: string };
  if (json.error) throw new Error(json.error);
  return json.data ?? null;
}

export async function apiSaveTasks(data: Task[]): Promise<void> {
  const json = await gasGet('saveTasks', { body: JSON.stringify(data) }) as { success?: boolean; error?: string };
  if (json.error) throw new Error(json.error);
}
