function ensureSheet_(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }

  const existingHeaders = sheet.getLastRow() > 0 ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] : [];
  const mismatch =
    existingHeaders.length !== headers.length ||
    headers.some(function (header, i) {
      return normalizeText_(existingHeaders[i]) !== header;
    });

  if (sheet.getLastRow() === 0 || mismatch) {
    sheet.clearContents();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }

  return sheet;
}

function seedMasterStatuses_() {
  const sheet = getSheetOrThrow_(SHEET_NAMES.MASTER_STATUSES);
  if (sheet.getLastRow() > 1) {
    return;
  }

  const rows = [
    ['未着手', true, 10, '#6c757d'],
    ['進行中', true, 20, '#0077b6'],
    ['レビュー中', true, 30, '#f77f00'],
    ['完了', true, 40, '#2a9d8f'],
    ['納品済', true, 50, '#588157'],
    ['差戻し', true, 60, '#9b2226']
  ];

  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}

function seedMasterTaskTypes_() {
  const sheet = getSheetOrThrow_(SHEET_NAMES.MASTER_TASK_TYPES);
  if (sheet.getLastRow() > 1) {
    return;
  }

  const taskTypes = ['企画', '脚本', 'イラスト案', 'サムネ監', 'イラスト', '編集', 'サムネ', 'イラスト監', 'その他', '休暇'];
  const rows = taskTypes.map(function (name, index) {
    return [name, true, (index + 1) * 10];
  });
  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}

function seedMasterChannels_() {
  const sheet = getSheetOrThrow_(SHEET_NAMES.MASTER_CHANNELS);
  if (sheet.getLastRow() > 1) {
    return;
  }

  const rows = [
    ['メインチャンネル', true, 10],
    ['サブチャンネル', true, 20]
  ];
  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}

function seedUsers_() {
  const sheet = getSheetOrThrow_(SHEET_NAMES.USERS);
  if (sheet.getLastRow() > 1) {
    return;
  }

  const email = Session.getActiveUser().getEmail();
  if (email) {
    sheet.appendRow([email, 'admin', true]);
  }
}

function initializeSchema() {
  ensureSheet_(SHEET_NAMES.TASKS, TASK_HEADERS);
  ensureSheet_(SHEET_NAMES.RELEASE_DATES, RELEASE_DATE_HEADERS);
  ensureSheet_(SHEET_NAMES.MASTER_CHANNELS, MASTER_CHANNEL_HEADERS);
  ensureSheet_(SHEET_NAMES.MASTER_TASK_TYPES, MASTER_TASK_TYPE_HEADERS);
  ensureSheet_(SHEET_NAMES.MASTER_STATUSES, MASTER_STATUS_HEADERS);
  ensureSheet_(SHEET_NAMES.USERS, USER_HEADERS);
  ensureSheet_(SHEET_NAMES.AUDIT_LOG, AUDIT_HEADERS);

  seedMasterStatuses_();
  seedMasterTaskTypes_();
  seedMasterChannels_();
  seedUsers_();
}
