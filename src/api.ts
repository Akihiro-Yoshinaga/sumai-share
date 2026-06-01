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

// ===== Gemini画像解析（フロント直接呼び出し） =====
export async function apiAnalyzePropertyImages(
  images: { base64: string; mimeType: string }[]
): Promise<{ name: string; rent: number; layout: string; sqm: number; address: string }> {
  const apiKey = localStorage.getItem('gemini_api_key');
  if (!apiKey) throw new Error('no_key');

  const prompt = [
    'これらの画像は同じ物件のスクリーンショットです（SUUMO・アットホーム等）。',
    '複数の画像から情報を統合して、以下のJSON形式で物件情報を抽出してください。値が読み取れない場合は空文字にしてください。',
    '{ "name": "物件名", "rent": 家賃の数値(円単位・管理費除く), "layout": "間取り", "sqm": 専有面積の数値(m²), "address": "住所" }',
    'JSONのみ返してください。説明文は不要です。'
  ].join('\n');

  const parts: unknown[] = [{ text: prompt }];
  for (const img of images) {
    parts.push({ inline_data: { mime_type: img.mimeType, data: img.base64 } });
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts }], generationConfig: { temperature: 0 } }),
    }
  );
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  const text: string = json.candidates[0].content.parts[0].text;
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('JSONが見つかりませんでした');
  return JSON.parse(m[0]);
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
