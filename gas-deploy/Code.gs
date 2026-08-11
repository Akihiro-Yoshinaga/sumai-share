var SPREADSHEET_ID   = '1yEtOotpg8UiVIshdAAUnrvnA3PWDOvHfA0rN_iGEbPQ';
var SHEET_CONDITIONS = '物件リサーチ要件一覧';
var SHEET_PROPERTIES = '物件';
var SHEET_ROUTINES   = 'ルーティン';
var SHEET_TASKS      = 'タスク';

function doGet(e) {
  var action = e && e.parameter && e.parameter.action;
  var body = {};
  if (e && e.parameter && e.parameter.body) {
    try { body = JSON.parse(e.parameter.body); } catch (_) {}
  }

  if (action === 'getConditions')          { return jsonResponse(getConditions()); }
  if (action === 'saveConditions')         { return jsonResponse(saveConditions(body)); }
  if (action === 'getProperties')          { return jsonResponse(getProperties()); }
  if (action === 'saveProperties')         { return jsonResponse(saveProperties(Array.isArray(body) ? body : (body.properties || []))); }
  if (action === 'getRoutines')            { return jsonResponse(getJsonSheet(SHEET_ROUTINES)); }
  if (action === 'saveRoutines')           { return jsonResponse(saveJsonSheet(SHEET_ROUTINES, Array.isArray(body) ? body : body.data)); }
  if (action === 'getTasks')               { return jsonResponse(getJsonSheet(SHEET_TASKS)); }
  if (action === 'saveTasks')              { return jsonResponse(saveJsonSheet(SHEET_TASKS, Array.isArray(body) ? body : body.data)); }
  if (action === 'analyzePropertyImages')  { return jsonResponse(analyzePropertyImages(body.images || [])); }

  // 通常アクセス: React アプリを返す
  var js0 = HtmlService.createHtmlOutputFromFile('js_part_0').getContent();
  var js1 = HtmlService.createHtmlOutputFromFile('js_part_1').getContent();
  var js2 = HtmlService.createHtmlOutputFromFile('js_part_2').getContent();
  var js3 = HtmlService.createHtmlOutputFromFile('js_part_3').getContent();

  var html = '<!DOCTYPE html><html lang="ja"><head>'
    + '<meta charset="UTF-8">'
    + '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
    + '<title>すまいシェア</title>'
    + '</head><body>'
    + '<div id="root"></div>'
    + '<script>' + js0 + js1 + js2 + js3 + '</script>'
    + '</body></html>';

  return HtmlService.createHtmlOutput(html)
    .setTitle('すまいシェア')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ===== 物件: 取得 =====
function getProperties() {
  try {
    var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEET_PROPERTIES);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_PROPERTIES);
      sheet.getRange(1, 1).setValue('json');
      return { data: [] };
    }
    var val = sheet.getRange(2, 1).getValue();
    if (!val) return { data: [] };
    return { data: JSON.parse(String(val)) };
  } catch (err) { return { error: err.toString() }; }
}

// ===== 物件: 保存 =====
function saveProperties(properties) {
  try {
    var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEET_PROPERTIES);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_PROPERTIES);
      sheet.getRange(1, 1).setValue('json');
    }
    sheet.getRange(2, 1).setValue(JSON.stringify(properties));
    return { success: true };
  } catch (err) { return { error: err.toString() }; }
}

// ===== 汎用JSONシート: 取得 =====
function getJsonSheet(sheetName) {
  try {
    var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.getRange(1, 1).setValue('json');
      return { data: null };
    }
    var val = sheet.getRange(2, 1).getValue();
    if (!val) return { data: null };
    return { data: JSON.parse(String(val)) };
  } catch (err) { return { error: err.toString() }; }
}

// ===== 汎用JSONシート: 保存 =====
function saveJsonSheet(sheetName, data) {
  try {
    var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.getRange(1, 1).setValue('json');
    }
    sheet.getRange(2, 1).setValue(JSON.stringify(data));
    return { success: true };
  } catch (err) { return { error: err.toString() }; }
}

// ===== Gemini画像解析 =====
function analyzePropertyImages(images) {
  try {
    var apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
    if (!apiKey) return { error: 'GEMINI_API_KEY not set in script properties' };

    var prompt = [
      'これらの画像は同じ物件のスクリーンショットです（SUUMO・アットホーム等）。',
      '複数の画像から情報を統合して、以下のJSON形式で物件情報を抽出してください。値が読み取れない場合は空文字にしてください。',
      '{ "name": "物件名", "rent": 家賃の数値(円単位・管理費除く), "layout": "間取り", "sqm": 専有面積の数値(m²), "address": "住所" }',
      'JSONのみ返してください。説明文は不要です。'
    ].join('\n');

    var parts = [{ text: prompt }];
    for (var i = 0; i < images.length; i++) {
      parts.push({ inline_data: { mime_type: images[i].mimeType, data: images[i].base64 } });
    }

    var res = UrlFetchApp.fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey,
      {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify({ contents: [{ parts: parts }], generationConfig: { temperature: 0 } }),
        muteHttpExceptions: true
      }
    );

    var json = JSON.parse(res.getContentText());
    if (json.error) return { error: json.error.message };

    var text = json.candidates[0].content.parts[0].text;
    var m = text.match(/\{[\s\S]*\}/);
    if (!m) return { error: 'JSON not found in response' };
    return { data: JSON.parse(m[0]) };
  } catch (err) { return { error: err.toString() }; }
}

// ===== 条件: 取得 =====
function getConditions() {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEET_CONDITIONS);
    if (!sheet) return { error: 'Sheet not found: ' + SHEET_CONDITIONS };

    var rows = sheet.getDataRange().getValues();
    if (rows.length < 2) return { data: [] };

    var result = [];
    for (var i = 1; i < rows.length; i++) {
      var row      = rows[i];
      var category = row[0] ? String(row[0]).trim() : '';
      var item     = row[1] ? String(row[1]).trim() : '';
      var detail   = row[2] ? String(row[2]).trim() : '';
      var priority = row[3] ? String(row[3]).trim() : '';
      var note     = row[4] ? String(row[4]).trim() : '';

      if (!item && !detail) continue;

      result.push({
        id: 'row_' + i,
        category: category,
        item: item,
        detail: detail,
        priority: priority,
        note: note
      });
    }
    return { data: result };
  } catch (err) {
    return { error: err.toString() };
  }
}

// ===== 条件: 保存 =====
function saveConditions(rows) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEET_CONDITIONS);
    if (!sheet) return { error: 'Sheet not found' };

    var header = sheet.getRange(1, 1, 1, 5).getValues()[0];
    sheet.clearContents();
    sheet.getRange(1, 1, 1, 5).setValues([header]);

    if (rows.length > 0) {
      var writeData = rows.map(function(r) {
        return [r.category || '', r.item || '', r.detail || '', r.priority || '', r.note || ''];
      });
      sheet.getRange(2, 1, writeData.length, 5).setValues(writeData);
    }
    return { success: true };
  } catch (err) {
    return { error: err.toString() };
  }
}

// =====================================================================
// 自動化：新着メール取り込み ＆ 募集終了スイープ
// （時間トリガー／GASエディタからの手動実行で動作。doGet からは呼ばない）
// =====================================================================

var SHEET_ARCHIVE     = '物件_アーカイブ';
var GMAIL_LABEL_DONE  = 'sumai-share-取込済み';
// 検索対象の差出人（各ポータルの「保存した検索条件」新着お知らせメール）
// ※ debugListingMails で実際の差出人を確認してから実態に合わせること
var MAIL_FROM_QUERY   = '(from:suumo.jp OR from:athome.co.jp OR from:homes.co.jp)';
// ポータル側の「保存した検索条件」で確実に絞り込まれているMUST条件の行ID。
// ID はシート「物件リサーチ要件一覧」の行ID（getConditions が返す id）と一致させること。
// 画面側は同じシートを参照して適合率を出すので、ここがズレると表示が嘘になる。
//
// シートのMUST（2026-08-11時点・全8件）と、アットホーム保存条件での担保状況：
//   row_1  家賃総額 25万円以内（管理費込）… ✗ 30万円で運用すると決めたため保証されない
//   row_3  大型スーパー近く              … ✗ 検索条件から除外（内見時の手動確認）
//   row_4  2LDK以上                     … ✓ 保証される
//   row_7  シンクとコンロの間のスペース   … ✗ 検索条件に該当項目なし
//   row_8  バイク置き場                  … ✗ 該当171件と少なく通知が来なくなるため除外
//   row_9  浴室乾燥機                    … ✓ 保証される
//   row_10 宅配ボックス                  … ✓ 保証される
//   row_17 2口以上ガスコンロ             … ✓ 保証される
//
// 満たしていない条件を「満たした」と記録しないため、保証されないものは貼らない。
// 保存条件やシートの行を変更したら、この配列も必ず合わせて更新すること。
var MUST_TAGS_COVERED = ['row_4', 'row_9', 'row_10', 'row_17'];
// 募集終了とみなすキーワード（誤検出を避けるため限定的に。ヒットすれば「終了」）
var CLOSED_KEYWORDS   = [
  '掲載を終了', '掲載が終了', '掲載終了しました',
  '成約済み', 'ご成約済み', '募集を終了',
  '現在ご紹介できません', 'ご紹介を終了',
  'ページが見つかりません', 'お探しのページは'
];

// ---- 小物 ----
function todayStr_() {
  return Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
}
function nowStr_() {
  return Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss');
}
// URLの表記ゆれを吸収して重複判定に使う（末尾スラッシュ・#以降を除去）
function normalizeUrl_(u) {
  if (!u) return '';
  return String(u).split('#')[0].replace(/\/+$/, '').toLowerCase();
}

// ---- Gemini：メール本文から物件を配列で抽出 ----
function extractPropertiesFromEmailText_(text) {
  var apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) throw new Error('GEMINI_API_KEY not set in script properties');

  var prompt = [
    '以下はSUUMOまたはアットホームの「新着物件お知らせメール」の本文です。',
    'メールに含まれる賃貸物件を1件ずつ抽出し、JSON配列で返してください。',
    '各要素の形式:',
    '{ "name": "物件名", "rent": 家賃の数値(円単位・管理費除く), "layout": "間取り", "sqm": 専有面積の数値(m2), "address": "住所", "url": "その物件の詳細ページURL" }',
    '注意: urlは各物件の詳細ページへのリンクを必ず入れてください。読み取れない値は空文字、rentとsqmは0にしてください。',
    '物件が1件も無ければ空配列 [] を返してください。JSON配列のみ返し、説明文やコードブロック記号は付けないでください。',
    '---メール本文ここから---',
    text
  ].join('\n');

  var res = UrlFetchApp.fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey,
    {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0 } }),
      muteHttpExceptions: true
    }
  );
  var json = JSON.parse(res.getContentText());
  if (json.error) throw new Error(json.error.message);
  var out = json.candidates[0].content.parts[0].text;
  var m = out.match(/\[[\s\S]*\]/);
  if (!m) return [];
  try { return JSON.parse(m[0]); } catch (e) { return []; }
}

// ---- 機能A：新着メール → 物件を自動登録 ----
function ingestListingMails() {
  var label = GmailApp.getUserLabelByName(GMAIL_LABEL_DONE) || GmailApp.createLabel(GMAIL_LABEL_DONE);
  var query = MAIL_FROM_QUERY + ' newer_than:14d -label:"' + GMAIL_LABEL_DONE + '"';
  var threads = GmailApp.search(query, 0, 30);
  if (!threads.length) { Logger.log('新着メールなし'); return { added: 0, threads: 0 }; }

  var current = getProperties();
  var props = (current && current.data) ? current.data : [];
  var seen = {};
  props.forEach(function(p) { if (p.url) seen[normalizeUrl_(p.url)] = true; });

  var added = 0;
  var stamp = Date.now();
  for (var t = 0; t < threads.length; t++) {
    var msgs = threads[t].getMessages();
    for (var mi = 0; mi < msgs.length; mi++) {
      var extracted = [];
      try { extracted = extractPropertiesFromEmailText_(msgs[mi].getPlainBody()); }
      catch (e) { Logger.log('抽出失敗: ' + e); continue; }
      for (var k = 0; k < extracted.length; k++) {
        var it = extracted[k];
        if (!it || !it.url) continue;
        var key = normalizeUrl_(it.url);
        if (seen[key]) continue;
        seen[key] = true;
        props.push({
          id: 'p' + (stamp++),
          name: it.name || '(名称未取得)',
          rent: Number(it.rent) || 0,
          layout: it.layout || '',
          sqm: Number(it.sqm) || 0,
          url: it.url,
          address: it.address || '',
          metAt: todayStr_(),
          source: 'auto', // 画面で手動追加分と分けて表示するための目印
          mustTagIds: MUST_TAGS_COVERED.slice(),
          ratings: [
            { userId: 'akihiro', stars: 0, compromise: '' },
            { userId: 'akari',   stars: 0, compromise: '' }
          ]
        });
        added++;
      }
    }
    threads[t].addLabel(label); // 取込済みラベルで二重登録を防ぐ
  }
  if (added > 0) saveProperties(props);
  Logger.log('取込完了: ' + added + '件追加 / ' + threads.length + 'スレッド走査');
  return { added: added, threads: threads.length };
}

// ---- 機能B：URLを見て募集終了を判定 ----
function judgeListing_(url) {
  if (!url) return 'unknown';
  try {
    var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true });
    var code = res.getResponseCode();
    if (code === 404 || code === 410) return 'closed';
    if (code >= 500) return 'unknown';
    var html = res.getContentText();
    for (var i = 0; i < CLOSED_KEYWORDS.length; i++) {
      if (html.indexOf(CLOSED_KEYWORDS[i]) !== -1) return 'closed';
    }
    return 'open';
  } catch (e) {
    return 'unknown'; // 取得失敗は消さない
  }
}

// ---- 機能B：終了物件をアーカイブへ退避してから削除 ----
function sweepClosedListings() {
  var current = getProperties();
  var props = (current && current.data) ? current.data : [];
  if (!props.length) { Logger.log('物件なし'); return { removed: 0, checked: 0 }; }

  var keep = [];
  var archived = [];
  for (var i = 0; i < props.length; i++) {
    var verdict = judgeListing_(props[i].url);
    if (verdict === 'closed') archived.push(props[i]);
    else keep.push(props[i]); // open も unknown も残す
  }
  if (archived.length) {
    archiveProperties_(archived);
    saveProperties(keep);
  }
  Logger.log('スイープ完了: ' + archived.length + '件アーカイブ / ' + props.length + '件中');
  return { removed: archived.length, checked: props.length };
}

// ---- アーカイブ退避（誤削除しても復元できるように） ----
function archiveProperties_(items) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_ARCHIVE);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_ARCHIVE);
    sheet.getRange(1, 1, 1, 4).setValues([['退避日時', '物件名', 'URL', 'JSON']]);
  }
  var now = nowStr_();
  var rows = items.map(function(p) { return [now, p.name || '', p.url || '', JSON.stringify(p)]; });
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 4).setValues(rows);
}

// ---- 時間トリガー設置（1回だけエディタから実行する） ----
// ※ 末尾に _ が付く関数はGASのプライベート扱いで実行ドロップダウンに出ないため、
//    エディタから選べる公開名のラッパーを用意している。実行するのはこちら。
function setupSumaiTriggers() {
  setupSumaiTriggers_();
}
// ---- 現在のトリガー設置状況を確認する（診断用） ----
function checkSumaiTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  if (!triggers.length) { Logger.log('トリガーは1件も設置されていません'); return; }
  for (var i = 0; i < triggers.length; i++) {
    Logger.log('関数=' + triggers[i].getHandlerFunction() + ' ／ 種別=' + triggers[i].getEventType());
  }
}
function setupSumaiTriggers_() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    var fn = triggers[i].getHandlerFunction();
    if (fn === 'ingestListingMails' || fn === 'sweepClosedListings') ScriptApp.deleteTrigger(triggers[i]);
  }
  ScriptApp.newTrigger('ingestListingMails').timeBased().everyDays(1).atHour(7).create();   // 毎日7時
  ScriptApp.newTrigger('sweepClosedListings').timeBased().everyDays(1).atHour(4).create();  // 毎日4時
  Logger.log('トリガー設置完了：取込=毎日7時 / スイープ=毎日4時');
}

// ---- テスト用（エディタから手動実行して権限承認＆精度確認） ----
function testIngestMails() {
  Logger.log(JSON.stringify(ingestListingMails()));
}
function testSweepOne() {
  var current = getProperties();
  var props = (current && current.data) ? current.data : [];
  if (!props.length) { Logger.log('物件が0件です'); return; }
  var p = props[0];
  Logger.log('URL: ' + p.url);
  Logger.log('判定: ' + judgeListing_(p.url) + '（closed=終了 / open=掲載中 / unknown=判定不能）');
}

// ---- 診断用：どんな差出人のメールが受信トレイにあるか調べる ----
// これを実行して、SUUMO/アットホームからのメールの実際の差出人アドレスを確認する
function debugListingMails() {
  var queries = [
    'from:suumo.jp newer_than:60d',
    'from:athome.co.jp newer_than:60d',
    'from:homes.co.jp newer_than:60d',
    'suumo newer_than:60d',
    'アットホーム newer_than:60d',
    "(HOME'S OR ホームズ OR ライフル) newer_than:60d",
    '(新着物件 OR 新着のお知らせ OR おすすめ物件 OR 保存した検索条件 OR 条件に合う物件) newer_than:60d'
  ];
  for (var q = 0; q < queries.length; q++) {
    var th = GmailApp.search(queries[q], 0, 5);
    Logger.log('■ [' + queries[q] + '] → ' + th.length + '件');
    for (var i = 0; i < th.length; i++) {
      var m = th[i].getMessages()[0];
      Logger.log('    from=' + m.getFrom() + ' ／ 件名=' + m.getSubject() + ' ／ ' + m.getDate());
    }
  }
}
