// ===== 設定 =====
var SPREADSHEET_ID    = '1yEtOotpg8UiVIshdAAUnrvnA3PWDOvHfA0rN_iGEbPQ';
var SHEET_CONDITIONS  = '表_1';
var GEMINI_MODEL      = 'gemini-1.5-flash';

// GeminiのAPIキーはスクリプトプロパティ "GEMINI_API_KEY" に保存すること

// ===== エントリポイント =====
function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  try {
    var params = {};
    if (e && e.parameter) params = e.parameter;

    // POSTのJSONボディをパース
    var body = {};
    if (e && e.postData && e.postData.contents) {
      try { body = JSON.parse(e.postData.contents); } catch (_) {}
    }

    var action = params.action || body.action || '';

    if (action === 'scrapeProperty') {
      var imageBase64 = body.imageBase64 || '';
      var mimeType    = body.mimeType    || 'image/jpeg';
      output.setContent(JSON.stringify(analyzePropertyImage(imageBase64, mimeType)));
      return output;
    }

    if (action === 'getConditions') {
      output.setContent(JSON.stringify(getConditions()));
      return output;
    }

    if (action === 'saveConditions') {
      var rows = body.rows || (params.body ? JSON.parse(params.body) : []);
      output.setContent(JSON.stringify(saveConditions(rows)));
      return output;
    }

    output.setContent(JSON.stringify({ error: 'unknown action: ' + action }));
    return output;

  } catch (err) {
    output.setContent(JSON.stringify({ error: err.toString() }));
    return output;
  }
}

// ===== Gemini でスクショから物件情報を抽出 =====
function analyzePropertyImage(imageBase64, mimeType) {
  if (!imageBase64) return { error: 'imageBase64 is empty' };

  var apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) return { error: 'GEMINI_API_KEY not set in script properties' };

  var prompt = [
    'この画像は不動産サイト（SUUMO・アットホーム等）の物件ページのスクリーンショットです。',
    '以下のJSON形式で物件情報を抽出してください。値が読み取れない場合は空文字にしてください。',
    '',
    '{',
    '  "name": "物件名（例: ガーデニエール砧WEST）",',
    '  "rent": 家賃（数値・円単位、管理費除く）,',
    '  "layout": "間取り（例: 2LDK）",',
    '  "sqm": 専有面積（数値・m²単位）,',
    '  "address": "住所（例: 世田谷区砧）",',
    '  "note": "特記事項（築年数・階数・駅徒歩など）"',
    '}',
    '',
    'JSONのみ返してください。説明文は不要です。'
  ].join('\n');

  var payload = {
    contents: [{
      parts: [
        { text: prompt },
        {
          inline_data: {
            mime_type: mimeType,
            data: imageBase64
          }
        }
      ]
    }],
    generationConfig: {
      temperature: 0,
      response_mime_type: 'application/json'
    }
  };

  var url = 'https://generativelanguage.googleapis.com/v1beta/models/'
    + GEMINI_MODEL + ':generateContent?key=' + apiKey;

  var response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  if (response.getResponseCode() !== 200) {
    return { error: 'Gemini API error: ' + response.getContentText() };
  }

  var result = JSON.parse(response.getContentText());
  var text = result.candidates[0].content.parts[0].text;

  // JSONブロックを抽出
  var jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { error: 'JSON not found in response: ' + text };

  var data = JSON.parse(jsonMatch[0]);
  return {
    data: {
      name:    data.name    || '',
      rent:    Number(data.rent)  || 0,
      layout:  data.layout  || '',
      sqm:     Number(data.sqm)   || 0,
      address: data.address || '',
      note:    data.note    || '',
      url:     '',
      metAt:   Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd')
    }
  };
}

// ===== スプレッドシート: 条件取得 =====
function getConditions() {
  try {
    var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEET_CONDITIONS);
    if (!sheet) return { error: 'Sheet not found: ' + SHEET_CONDITIONS };

    var rows = sheet.getDataRange().getValues();
    if (rows.length < 2) return { data: [] };

    var result = [];
    for (var i = 1; i < rows.length; i++) {
      var row = rows[i];
      var item = row[1] ? String(row[1]).trim() : '';
      var detail = row[2] ? String(row[2]).trim() : '';
      if (!item && !detail) continue;
      result.push({
        id:       'row_' + i,
        category: row[0] ? String(row[0]).trim() : '',
        item:     item,
        detail:   detail,
        priority: row[3] ? String(row[3]).trim() : '',
        note:     row[4] ? String(row[4]).trim() : ''
      });
    }
    return { data: result };
  } catch (err) {
    return { error: err.toString() };
  }
}

// ===== スプレッドシート: 条件保存 =====
function saveConditions(rows) {
  try {
    var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
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
