# 引き継ぎ文書: gas-integration-and-sharing

日付: 2026-05-31

---

## 1. タスクの目的と現状

すまいシェアアプリのデータをGoogle Apps Script（GAS）経由でSpreadsheetに保存し、あきひろ・あかりの2人でリアルタイムに共有できるようにする。

**現状:**
- 物件・条件・ルーティン・タスクのGAS連携は完了
- 2人での共有も動作確認済み
- 画像読み取り（Gemini API）がGAS側の権限エラーで動作しない
- 物件カードの再編集機能が未実装

---

## 2. 完了したこと / 未完了のこと

### ✅ 完了
- 物件の星評価・妥協点をSpreadsheetに保存（ローカルstateのみだったバグを修正）
- ルーティン・タスクのGAS保存・読み込みを実装
- Gemini画像解析をGAS側（スクリプトプロパティ `GEMINI_API_KEY`）経由に変更
- 設定ページのAPIキー入力欄を削除
- GASのアクセス権限を「全員（匿名含む）」に変更し2人で共有できるようになった
- メールアドレスによるアクセス制限を削除（`executeAs: USER_DEPLOYING` と競合するため）
- シート名を `表_1` → `物件リサーチ要件一覧` に修正
- 物件データのlocalStorageフォールバック実装（GAS失敗時も消えない）
- `Task` 型を `types.ts` に追加

### ❌ 未完了
- **Gemini画像解析（GAS経由）が動かない**
  - エラー: `UrlFetchApp.fetch を呼び出す権限がありません`
  - 対応: `appsscript.json` に `script.external_request` スコープを追加済み
  - **GASエディタで手動デプロイ → 承認ダイアログを「許可」する必要がある**
- 物件カードの再編集機能（未実装）

---

## 3. 設計判断とその理由

- **`executeAs: USER_DEPLOYING`**: GASをAPIサーバーとして使うため。`USER_ACCESSING` だとユーザーのセッションが必要になりfetchが通らない。
- **`access: ANYONE`（匿名含む）**: GitHub PagesからのfetchはCookieが送れないため認証不要にする必要があった。セキュリティリスクはURLの秘匿性に依存するが、家探し期間限定のアプリとして許容。
- **localStorageフォールバック**: GASが一時的に失敗しても物件データが消えないようにするため。GAS成功時はlocalStorageも同期する。
- **メールアドレス制限削除**: `executeAs: USER_DEPLOYING` だと `Session.getActiveUser()` が常にデプロイ者を返すため、あかりさんが弾かれてしまうため削除。

---

## 4. 次セッションで最初にやるべき具体的な手順

### Step 1: Gemini画像解析の権限承認（手動操作が必要）
1. GASエディタ（https://script.google.com/home/projects/1ALQAsmL5gTaRvlfs-WVhGzkVtXK1SeE6K1p27PxCJxA3drB9gBuhGP9X/edit）を開く
2. 「デプロイ」→「デプロイを管理」→鉛筆アイコン→「新しいバージョン」→「デプロイ」
3. **承認ダイアログが出たら「許可」を押す**（外部リクエスト権限の承認）
4. 動作確認: `curl -s "https://script.google.com/macros/s/AKfycbw5SoTPZ2g2VPGq5uevmJl4LnIlk4h-3CgdDK0Z53_yZR2FQpAcHVZcCQQPPK2q9pr8/exec?action=analyzePropertyImages" -L` でエラーが消えればOK

### Step 2: Gemini APIキーの方針決定・実装
- GAS経由ではなくフロントから直接Gemini APIを呼ぶ方式に戻す
- APIキーは `VITE_GEMINI_API_KEY` としてGitHub Secretsに追加 → ビルド時にJSに埋め込む
- **注意**: リポジトリがpublicなのでGoogleのコンソールでAPIキーに **ドメイン制限（`akihiro-yoshinaga.github.io` のみ）** をかけること
- 実装手順:
  1. Google AI StudioでAPIキーにドメイン制限を設定
  2. GitHub Secrets に `VITE_GEMINI_API_KEY` を追加
  3. `src/pages/PropertiesPage.tsx` の `analyzeImages` をGAS経由から直接fetch方式に戻す
  4. `src/api.ts` の `apiAnalyzePropertyImages` は削除
  5. `gas-deploy/Code.gs` の `analyzePropertyImages` 関数は残してもOK

### Step 3: 物件カードの再編集機能を実装
- `PropertyCard` に編集モーダルを追加
- 既存の `AddPropertyModal` を編集用にも使い回す（`initialData` を受け取れるよう改修）
- 編集後は `onRatingChange` と同様に親の `saveProperties` を呼ぶ

---

## 5. 触ったファイル一覧

```
src/api.ts                        # apiAnalyzePropertyImages, apiGetTasks, apiSaveTasks 追加
src/types.ts                      # Task型追加
src/pages/PropertiesPage.tsx      # 星評価保存修正、localStorageフォールバック、Gemini解析GAS経由化
src/pages/RoutinePage.tsx         # GAS保存・読み込み実装
src/pages/TasksPage.tsx           # GAS保存・読み込み実装、MOCK_TASKS削除
src/pages/SettingsPage.tsx        # APIキー入力欄削除
gas-deploy/Code.gs                # 物件・ルーティン・タスク・Gemini解析API追加、シート名修正、メール制限削除
gas-deploy/appsscript.json        # executeAs USER_DEPLOYING、oauthScopes追加
gas-deploy/.clasp.json            # scriptIdを正しいIDに修正
gas-api/Code.gs                   # analyzePropertyImages追加、シート名修正
```

---

## 6. 落とし穴・注意点

- **claspでのデプロイは `executeAs`/`access` の変更が反映されない**: GASエディタでの手動デプロイが必要。スコープ変更も同様で承認が必要。
- **GASデプロイID**: `AKfycbw5SoTPZ2g2VPGq5uevmJl4LnIlk4h-3CgdDK0Z53_yZR2FQpAcHVZcCQQPPK2q9pr8`（手動デプロイで新しいIDが作られていないか要確認）
- **Spreadsheetのシート名**: コード上 `SHEET_CONDITIONS = '物件リサーチ要件一覧'`（`表_1` ではない）
- **gas-deploy と gas-api は別物**: `gas-deploy` が本番。`gas-api` は参考用のシンプル版。
- **物件データはlocalStorage + GAS二重保存**: GAS成功時はlocalStorageも上書きされる。
