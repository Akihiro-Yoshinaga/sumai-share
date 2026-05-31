var ALLOWED_EMAILS = [
  'akihiro.55594@gmail.com',
  'akari.4n@gmail.com'
];

function doGet() {
  var email = Session.getActiveUser().getEmail();

  if (ALLOWED_EMAILS.indexOf(email) === -1) {
    return HtmlService.createHtmlOutput(
      '<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<style>' +
      'body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;' +
      'font-family:-apple-system,sans-serif;background:#f8fafc;}' +
      '.box{text-align:center;padding:40px;background:#fff;border-radius:16px;' +
      'border:1px solid #e2e8f0;max-width:360px;}' +
      '</style></head><body>' +
      '<div class="box"><div style="font-size:40px;margin-bottom:16px">🔒</div>' +
      '<h1 style="font-size:18px;color:#102a43">アクセスできません</h1>' +
      '<p style="font-size:13px;color:#64748b">' + email + '</p>' +
      '</div></body></html>'
    ).setTitle('アクセス拒否');
  }

  // JS を4分割して1つのhtmlに結合して返す
  var js0 = HtmlService.createHtmlOutputFromFile('js_part_0').getContent();
  var js1 = HtmlService.createHtmlOutputFromFile('js_part_1').getContent();
  var js2 = HtmlService.createHtmlOutputFromFile('js_part_2').getContent();
  var js3 = HtmlService.createHtmlOutputFromFile('js_part_3').getContent();
  var css = HtmlService.createHtmlOutputFromFile('app_css').getContent();

  var html = '<!DOCTYPE html><html lang="ja"><head>'
    + '<meta charset="UTF-8">'
    + '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
    + '<title>すまいシェア</title>'
    + '<style>' + css + '</style>'
    + '</head><body>'
    + '<div id="root"></div>'
    + '<script>' + js0 + js1 + js2 + js3 + '</script>'
    + '</body></html>';

  return HtmlService.createHtmlOutput(html)
    .setTitle('すまいシェア')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}
