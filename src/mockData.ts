import type { Tag, Condition, Property, RoutineDay } from './types';

export const mockTags: Tag[] = [
  { id: 't1', label: '駅徒歩15分以内', type: 'must', createdAt: '2026-05-20' },
  { id: 't2', label: '2LDK以上', type: 'must', createdAt: '2026-05-20' },
  { id: 't3', label: '2口ガスコンロ以上', type: 'must', createdAt: '2026-05-21' },
  { id: 't4', label: '家賃25万円以内', type: 'must', createdAt: '2026-05-21' },
  { id: 't5', label: 'バイク置き場', type: 'must', createdAt: '2026-05-22' },
  { id: 't6', label: '浴室乾燥機', type: 'must', createdAt: '2026-05-22' },
  { id: 't7', label: '宅配ボックス', type: 'must', createdAt: '2026-05-22' },
  { id: 't8', label: '大型スーパー近く', type: 'must', createdAt: '2026-05-23' },
  { id: 't9', label: 'オートロック', type: 'want', createdAt: '2026-05-23' },
  { id: 't10', label: '日当たり良好', type: 'want', createdAt: '2026-05-24' },
];

// スプレッドシート「表_1」に対応するMockデータ
export const mockConditions: Condition[] = [
  { id: 'c1',  category: '予算',     item: '家賃総額',    detail: '25万円以内（管理費込）',      priority: 'MUST', note: '最難関だったエリア指定と駐車場指定が外れたため物件の選択肢が大幅に広がります。' },
  { id: 'c2',  category: 'エリア',   item: '徒歩分数',    detail: '15分以内',                   priority: 'WANT', note: 'バス利用や少し遠いエリアも視野に。' },
  { id: 'c3',  category: 'エリア',   item: '周辺環境',    detail: '大型スーパー近く',            priority: 'MUST', note: 'ライフ、ピーコック等。' },
  { id: 'c4',  category: '間取り',   item: '間取り',      detail: '2LDK以上',                   priority: 'MUST', note: '書斎確保のため譲れない。' },
  { id: 'c5',  category: '間取り',   item: '広さ',        detail: '指定なし（45㎡〜）',          priority: '-',    note: '40〜50㎡のコンパクトな2LDKも視野に。' },
  { id: 'c6',  category: '設備',     item: 'キッチン',    detail: '2口ガスコンロ以上',           priority: 'MUST', note: '料理人仕様。ここは絶対に譲れないポイント。' },
  { id: 'c7',  category: '設備',     item: 'キッチン',    detail: '3口ガスコンロ',               priority: 'WANT', note: '調理のしやすさから理想的。' },
  { id: 'c8',  category: '設備',     item: 'キッチン',    detail: 'シンクとガスコンロの間のスペースあり', priority: 'WANT', note: '調理のしやすさから理想的。' },
  { id: 'c9',  category: '設備',     item: '駐輪・駐車',  detail: 'バイク置き場',                priority: 'MUST', note: '中型バイク' },
  { id: 'c10', category: '設備',     item: '浴室・洗面',  detail: '浴室乾燥機',                 priority: 'MUST', note: '' },
  { id: 'c11', category: '設備',     item: '共有設備',    detail: '宅配ボックス',               priority: 'MUST', note: '不在時の受け取りに必須。' },
  { id: 'c12', category: '設備',     item: '共有設備',    detail: '24hゴミ出しOK',              priority: 'WANT', note: '時間を気にせずゴミ出しできるため快適性が向上。' },
  { id: 'c13', category: '設備',     item: 'セキュリティ', detail: 'オートロック',               priority: 'WANT', note: '防犯面で安心。' },
  { id: 'c14', category: '室内・環境', item: '日当たり',  detail: '日当たり良好',               priority: 'WANT', note: '快適な住環境のために。' },
  { id: 'c15', category: 'その他',   item: '築年数',      detail: '15年以内',                   priority: 'WANT', note: 'リノベーション物件であればその限りではない' },
];

export const mockProperties: Property[] = [
  {
    id: 'p1',
    name: 'ハーモニーレジデンス三軒茶屋',
    rent: 198000,
    layout: '2LDK',
    sqm: 58.2,
    address: '世田谷区三軒茶屋2丁目',
    metAt: '2026-05-25',
    url: 'https://example.com/p1',
    mustTagIds: ['t1', 't2', 't3', 't4'],
    ratings: [
      { userId: 'akihiro', stars: 4, compromise: '収納が少し狭い' },
      { userId: 'akari', stars: 5, compromise: 'なし' },
    ],
  },
  {
    id: 'p2',
    name: 'グランヴィラ中目黒',
    rent: 220000,
    layout: '2LDK',
    sqm: 63.5,
    address: '目黒区中目黒3丁目',
    metAt: '2026-05-26',
    url: 'https://example.com/p2',
    mustTagIds: ['t1', 't2', 't3'],
    ratings: [
      { userId: 'akihiro', stars: 5, compromise: '家賃が少し高め' },
      { userId: 'akari', stars: 3, compromise: '駅から坂道がある' },
    ],
  },
  {
    id: 'p3',
    name: 'ソレイユ恵比寿',
    rent: 235000,
    layout: '2DK',
    sqm: 52.0,
    address: '渋谷区恵比寿南1丁目',
    metAt: '2026-05-27',
    url: 'https://example.com/p3',
    mustTagIds: ['t1', 't4'],
    ratings: [
      { userId: 'akihiro', stars: 3, compromise: '間取りが2DKで狭い' },
      { userId: 'akari', stars: 2, compromise: '収納と間取りに不満' },
    ],
  },
  {
    id: 'p4',
    name: 'シーズンテラス代官山',
    rent: 248000,
    layout: '3LDK',
    sqm: 72.8,
    address: '渋谷区代官山町',
    metAt: '2026-05-28',
    url: 'https://example.com/p4',
    mustTagIds: ['t1', 't2', 't3', 't5', 't6', 't7'],
    ratings: [
      { userId: 'akihiro', stars: 5, compromise: '家賃が予算オーバー' },
      { userId: 'akari', stars: 4, compromise: '家賃が高い' },
    ],
  },
];

export const mockRoutineDays: RoutineDay[] = [
  {
    id: 'rd1',
    dayType: 'weekday',
    blocks: [
      {
        id: 'b1', startHour: 6, startMin: 0, endHour: 7, endMin: 0,
        label: '起床・朝の準備', color: '#f0f4f8', userId: 'both',
        note: '洗面台の取り合いが発生しがち。独立洗面台が必要。',
        requiredFeatures: ['独立洗面台', '洗面スペース2人分'],
      },
      {
        id: 'b2', startHour: 7, startMin: 0, endHour: 8, endMin: 0,
        label: '朝食・出発', color: '#f0f4f8', userId: 'both',
        note: 'キッチンで朝食を一緒に作りたい。アイランドキッチン理想。',
        requiredFeatures: ['対面キッチン', 'ダイニングスペース'],
      },
      {
        id: 'b3', startHour: 19, startMin: 0, endHour: 21, endMin: 0,
        label: '帰宅・夕食', color: '#d9e2ec', userId: 'both',
        note: '帰宅時間がバラバラなので、玄関→リビングの動線をシンプルに。',
        requiredFeatures: ['広めの玄関', 'リビング直結の動線'],
      },
      {
        id: 'b4', startHour: 21, startMin: 0, endHour: 23, endMin: 0,
        label: 'リラックスタイム', color: '#d9e2ec', userId: 'both',
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
        id: 'b5', startHour: 8, startMin: 0, endHour: 10, endMin: 0,
        label: 'ゆっくり起床・ブランチ', color: '#f0f4f8', userId: 'both',
        note: '休日は窓から光が入る明るいリビングで過ごしたい。南向き希望。',
        requiredFeatures: ['南向きリビング', '広いダイニングテーブル置ける'],
      },
      {
        id: 'b6', startHour: 10, startMin: 0, endHour: 13, endMin: 0,
        label: '外出 / 買い物', color: '#bcccdc', userId: 'both',
        note: '自転車で近くのスーパーに行きたい。駐輪場必須。',
        requiredFeatures: ['駐輪場'],
      },
      {
        id: 'b7', startHour: 14, startMin: 0, endHour: 17, endMin: 0,
        label: 'あきひろの趣味時間', color: '#d9e2ec', userId: 'akihiro',
        note: '読書・テレワーク。静かな個室orワークコーナーが欲しい。',
        requiredFeatures: ['個室or書斎コーナー'],
      },
      {
        id: 'b8', startHour: 19, startMin: 0, endHour: 21, endMin: 0,
        label: '自炊・夕食', color: '#d9e2ec', userId: 'both',
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
