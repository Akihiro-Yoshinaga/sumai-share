import type { Task } from './types';

// 引っ越しの逆算タイムライン。
// 入居希望日からの「何日前か」でマイルストーンを定義し、タスクを生成する。
// 生成後は画面から内容・期限・担当を自由に変更できる（生成はあくまで下書き）。

export interface Milestone {
  key: string;          // タスクIDの元。再生成時の重複判定に使う
  daysBefore: number;   // 入居希望日の何日前を期限にするか
  title: string;
  category: string;     // TasksPage の CATEGORIES に合わせる
  assignee: Task['assignee'];
}

export const MILESTONES: Milestone[] = [
  {
    key: 'cancel-notice-check', daysBefore: 82, category: '手続き', assignee: 'both',
    title: '現在の賃貸契約書で「解約予告期間」を確認する（1ヶ月前か2ヶ月前か）',
  },
  {
    key: 'cancel-notice', daysBefore: 61, category: '手続き', assignee: 'both',
    title: '現在の物件へ解約通知を出す（2ヶ月前予告の場合はこの日が期限）',
  },
  {
    key: 'screening-docs', daysBefore: 61, category: '手続き', assignee: 'akihiro',
    title: '入居審査の書類を揃える（確定申告書の控え・納税証明書。事業主は取得に日数がかかる）',
  },
  {
    key: 'initial-cost', daysBefore: 47, category: '手続き', assignee: 'both',
    title: '初期費用の現金を確保する（家賃の4.5〜6ヶ月分。30万円なら135〜180万円）',
  },
  {
    key: 'viewing-start', daysBefore: 47, category: '内見', assignee: 'both',
    title: '内見を本格開始する（この時期から入居希望日に合う物件が出てくる）',
  },
  {
    key: 'decide-line', daysBefore: 47, category: '内見', assignee: 'both',
    title: '「この条件が揃ったら即決する」ラインを2人で合意しておく',
  },
  {
    key: 'mover-quote', daysBefore: 21, category: '引越し準備', assignee: 'both',
    title: '引越業者の見積もりを取る（3社ほど相見積もり）',
  },
  {
    key: 'apply', daysBefore: 21, category: '手続き', assignee: 'both',
    title: '入居申込・審査（審査は1週間前後かかる）',
  },
  {
    key: 'contract', daysBefore: 14, category: '手続き', assignee: 'both',
    title: '賃貸借契約を締結する（重要事項説明・初期費用の入金）',
  },
  {
    key: 'utilities', daysBefore: 7, category: '引越し準備', assignee: 'both',
    title: 'ライフラインの手続き（電気・ガス・水道・インターネット）',
  },
  {
    key: 'address-change', daysBefore: 7, category: '手続き', assignee: 'both',
    title: '転出届・住所変更の手続き',
  },
  {
    key: 'move-out', daysBefore: 0, category: '引越し準備', assignee: 'both',
    title: '旧居の退去立会い・鍵の返却',
  },
  {
    key: 'move-in', daysBefore: 0, category: '引越し準備', assignee: 'both',
    title: '新居の鍵の受け取り・入居',
  },
];

const TASK_ID_PREFIX = 'tl_';

export const timelineTaskId = (key: string) => `${TASK_ID_PREFIX}${key}`;

export const isTimelineTask = (t: Task) => t.id.startsWith(TASK_ID_PREFIX);

/** 入居希望日(YYYY-MM-DD)の daysBefore 日前を YYYY-MM-DD で返す */
export function dueDateFor(moveInDate: string, daysBefore: number): string {
  const d = new Date(`${moveInDate}T00:00:00`);
  d.setDate(d.getDate() - daysBefore);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * 逆算タイムラインのタスクを生成する。
 * 既に同じキーのタスクがある場合は上書きしない（手で直した内容を消さないため）。
 */
export function buildTimelineTasks(moveInDate: string, existing: Task[]): Task[] {
  const existingIds = new Set(existing.map(t => t.id));
  return MILESTONES
    .filter(m => !existingIds.has(timelineTaskId(m.key)))
    .map(m => ({
      id: timelineTaskId(m.key),
      title: m.title,
      dueDate: dueDateFor(moveInDate, m.daysBefore),
      assignee: m.assignee,
      done: false,
      category: m.category,
    }));
}
