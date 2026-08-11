export type TagType = 'must' | 'want';

export interface Tag {
  id: string;
  label: string;
  type: TagType;
  createdAt: string;
}

// スプレッドシート「表_1」の1行に対応
export interface Condition {
  id: string;
  category: string;
  item: string;
  detail: string;
  priority: 'MUST' | 'WANT' | '-' | '';
  note: string;
}

export interface PropertyRating {
  userId: 'akihiro' | 'akari';
  stars: number;
  compromise: string;
}

// 物件がどう登録されたか。'auto' は新着メールからの自動取り込み、'manual' は画面からの手動追加。
// 未設定（既存データ）は手動追加として扱う。
export type PropertySource = 'auto' | 'manual';

export interface Property {
  id: string;
  name: string;
  rent: number;
  layout: string;
  sqm: number;
  url: string;
  address: string;
  metAt: string;
  mustTagIds: string[];
  ratings: PropertyRating[];
  imageUrl?: string;
  source?: PropertySource;
}

export type DayType = 'weekday' | 'weekend';

export interface RoutineBlock {
  id: string;
  startHour: number;
  startMin: number;  // 0 | 10 | 20 | 30 | 40 | 50
  endHour: number;
  endMin: number;    // 0 | 10 | 20 | 30 | 40 | 50
  label: string;
  color: string;
  userId: 'akihiro' | 'akari' | 'both';
  note: string;
  requiredFeatures: string[];
}

export interface RoutineDay {
  id: string;
  dayType: DayType;
  blocks: RoutineBlock[];
}

export interface Task {
  id: string;
  title: string;
  dueDate: string;
  assignee: 'akihiro' | 'akari' | 'both';
  done: boolean;
  category: string;
}

// GAS API のベースURL（デプロイ後に設定）
export const GAS_API_URL = import.meta.env.VITE_GAS_URL ?? '';
