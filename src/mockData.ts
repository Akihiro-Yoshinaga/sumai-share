import type { Tag, Property, RoutineDay } from './types';

export const mockTags: Tag[] = [
  { id: 't1', label: '駅徒歩10分以内', type: 'must', createdAt: '2026-05-20' },
  { id: 't2', label: '2LDK以上', type: 'must', createdAt: '2026-05-20' },
  { id: 't3', label: '独立洗面台', type: 'must', createdAt: '2026-05-21' },
  { id: 't4', label: '家賃15万円以下', type: 'must', createdAt: '2026-05-21' },
  { id: 't5', label: 'ペット可', type: 'must', createdAt: '2026-05-22' },
  { id: 't6', label: '南向きリビング', type: 'want', createdAt: '2026-05-22' },
  { id: 't7', label: 'バス・トイレ別', type: 'want', createdAt: '2026-05-22' },
  { id: 't8', label: '宅配ボックス', type: 'want', createdAt: '2026-05-23' },
  { id: 't9', label: '築10年以内', type: 'want', createdAt: '2026-05-23' },
  { id: 't10', label: 'オートロック', type: 'want', createdAt: '2026-05-24' },
];

export const mockProperties: Property[] = [
  {
    id: 'p1',
    name: 'ハーモニーレジデンス三軒茶屋',
    rent: 148000,
    layout: '2LDK',
    sqm: 58.2,
    address: '世田谷区三軒茶屋2丁目',
    metAt: '2026-05-25',
    url: 'https://example.com/p1',
    mustTagIds: ['t1', 't2', 't3', 't4'],
    ratings: [
      { userId: 'partner1', stars: 4, compromise: '収納が少し狭い' },
      { userId: 'partner2', stars: 5, compromise: 'なし' },
    ],
  },
  {
    id: 'p2',
    name: 'グランヴィラ中目黒',
    rent: 162000,
    layout: '2LDK',
    sqm: 63.5,
    address: '目黒区中目黒3丁目',
    metAt: '2026-05-26',
    url: 'https://example.com/p2',
    mustTagIds: ['t1', 't2', 't3'],
    ratings: [
      { userId: 'partner1', stars: 5, compromise: '家賃が少し高め' },
      { userId: 'partner2', stars: 3, compromise: '駅から坂道がある' },
    ],
  },
  {
    id: 'p3',
    name: 'ソレイユ恵比寿',
    rent: 155000,
    layout: '2DK',
    sqm: 52.0,
    address: '渋谷区恵比寿南1丁目',
    metAt: '2026-05-27',
    url: 'https://example.com/p3',
    mustTagIds: ['t1', 't4'],
    ratings: [
      { userId: 'partner1', stars: 3, compromise: '間取りが2DKで狭い' },
      { userId: 'partner2', stars: 2, compromise: '収納と間取りに不満' },
    ],
  },
  {
    id: 'p4',
    name: 'シーズンテラス代官山',
    rent: 178000,
    layout: '3LDK',
    sqm: 72.8,
    address: '渋谷区代官山町',
    metAt: '2026-05-28',
    url: 'https://example.com/p4',
    mustTagIds: ['t1', 't2', 't3', 't5'],
    ratings: [
      { userId: 'partner1', stars: 5, compromise: '家賃が予算オーバー' },
      { userId: 'partner2', stars: 4, compromise: '家賃が高い' },
    ],
  },
];

export const mockRoutineDays: RoutineDay[] = [
  {
    id: 'rd1',
    dayType: 'weekday',
    blocks: [
      {
        id: 'b1',
        startHour: 6,
        endHour: 7,
        label: '起床・朝の準備',
        color: '#f0f4f8',
        userId: 'both',
        note: '洗面台の取り合いが発生しがち。独立洗面台が必要。',
        requiredFeatures: ['独立洗面台', '洗面スペース2人分'],
      },
      {
        id: 'b2',
        startHour: 7,
        endHour: 8,
        label: '朝食・出発',
        color: '#f0f4f8',
        userId: 'both',
        note: 'キッチンで朝食を一緒に作りたい。アイランドキッチン理想。',
        requiredFeatures: ['対面キッチン', 'ダイニングスペース'],
      },
      {
        id: 'b3',
        startHour: 19,
        endHour: 21,
        label: '帰宅・夕食',
        color: '#d9e2ec',
        userId: 'both',
        note: '帰宅時間がバラバラなので、玄関→リビングの動線をシンプルに。',
        requiredFeatures: ['広めの玄関', 'リビング直結の動線'],
      },
      {
        id: 'b4',
        startHour: 21,
        endHour: 23,
        label: 'リラックスタイム',
        color: '#d9e2ec',
        userId: 'both',
        note: '一緒にいるけど各自の時間も欲しい。ソファとデスクを別置きしたい。',
        requiredFeatures: ['リビングに6畳以上', 'ワークスペース確保'],
      },
    ],
  },
  {
    id: 'rd2',
    dayType: 'weekend',
    blocks: [
      {
        id: 'b5',
        startHour: 8,
        endHour: 10,
        label: 'ゆっくり起床・ブランチ',
        color: '#f0f4f8',
        userId: 'both',
        note: '休日は窓から光が入る明るいリビングで過ごしたい。南向き希望。',
        requiredFeatures: ['南向きリビング', '広いダイニングテーブル置ける'],
      },
      {
        id: 'b6',
        startHour: 10,
        endHour: 13,
        label: '外出 / 買い物',
        color: '#bcccdc',
        userId: 'both',
        note: '自転車で近くのスーパーに行きたい。駐輪場必須。',
        requiredFeatures: ['駐輪場'],
      },
      {
        id: 'b7',
        startHour: 14,
        endHour: 17,
        label: '各自の趣味時間',
        color: '#d9e2ec',
        userId: 'partner1',
        note: 'パートナー1は読書・テレワーク。静かな個室orワークコーナーが欲しい。',
        requiredFeatures: ['個室or書斎コーナー'],
      },
      {
        id: 'b8',
        startHour: 19,
        endHour: 21,
        label: '自炊・夕食',
        color: '#d9e2ec',
        userId: 'both',
        note: '2人で料理するので広めのキッチンが嬉しい。食洗機あれば◎',
        requiredFeatures: ['広めキッチン', '食洗機対応'],
      },
    ],
  },
];

export async function fetchTags(): Promise<Tag[]> {
  await new Promise(r => setTimeout(r, 400));
  return mockTags;
}

export async function fetchProperties(): Promise<Property[]> {
  await new Promise(r => setTimeout(r, 600));
  return mockProperties;
}

export async function fetchRoutineDays(): Promise<RoutineDay[]> {
  await new Promise(r => setTimeout(r, 500));
  return mockRoutineDays;
}
