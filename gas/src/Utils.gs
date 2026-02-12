class AppError extends Error {
  constructor(code, message, fields) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.fields = fields || [];
  }
}

function nowStamp_() {
  return Utilities.formatDate(new Date(), APP_TZ, 'yyyy-MM-dd HH:mm:ss');
}

function uuid_() {
  return Utilities.getUuid();
}

function parseBoolean_(value) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === 1 || value === '1') {
    return true;
  }
  if (value === 0 || value === '0') {
    return false;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === 'yes') {
      return true;
    }
    if (normalized === 'false' || normalized === 'no') {
      return false;
    }
  }
  return false;
}

function normalizeDate_(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, APP_TZ, 'yyyy-MM-dd');
  }

  if (typeof value === 'string') {
    const normalized = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
      return normalized;
    }

    const parsed = new Date(normalized);
    if (!Number.isNaN(parsed.getTime())) {
      return Utilities.formatDate(parsed, APP_TZ, 'yyyy-MM-dd');
    }
  }

  throw new AppError('VALIDATION', '日付形式が不正です。YYYY-MM-DD形式で入力してください。');
}

function normalizeText_(value) {
  return value === null || value === undefined ? '' : String(value).trim();
}

function jsonSuccess_(data) {
  return ContentService.createTextOutput(
    JSON.stringify({
      ok: true,
      data: data
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

function jsonError_(code, message, fields) {
  return ContentService.createTextOutput(
    JSON.stringify({
      ok: false,
      error: {
        code: code,
        message: message,
        fields: fields || []
      }
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

function parseRequestBody_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new AppError('VALIDATION', 'リクエストボディがありません。');
  }

  let parsed;
  try {
    parsed = JSON.parse(e.postData.contents);
  } catch (_err) {
    throw new AppError('VALIDATION', 'JSON形式が不正です。');
  }

  if (!parsed || typeof parsed.action !== 'string') {
    throw new AppError('VALIDATION', 'actionが必要です。');
  }

  return {
    action: parsed.action,
    payload: parsed.payload || {},
    requestId: parsed.requestId || ''
  };
}

function getSheetOrThrow_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(name);
  if (!sheet) {
    throw new AppError('INTERNAL', 'シートが見つかりません: ' + name);
  }
  return sheet;
}

function rowsToObjects_(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return [];
  }

  const headers = values[0].map(function (h) {
    return normalizeText_(h);
  });

  return values.slice(1).map(function (row, rowIndex) {
    const obj = {};
    headers.forEach(function (header, colIndex) {
      obj[header] = row[colIndex];
    });
    obj.__rowIndex = rowIndex + 2;
    return obj;
  });
}

function objectToOrderedRow_(obj, headers) {
  return headers.map(function (h) {
    return obj[h] !== undefined ? obj[h] : '';
  });
}

function withScriptLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

function toNumber_(value, fallback) {
  const num = Number(value);
  if (Number.isNaN(num)) {
    return fallback;
  }
  return num;
}

function naturalCompare_(left, right) {
  const a = normalizeText_(left);
  const b = normalizeText_(right);
  const partsA = a.match(/(\d+|\D+)/g) || [a];
  const partsB = b.match(/(\d+|\D+)/g) || [b];
  const max = Math.max(partsA.length, partsB.length);

  for (let i = 0; i < max; i += 1) {
    const partA = partsA[i];
    const partB = partsB[i];

    if (partA === undefined) return -1;
    if (partB === undefined) return 1;

    const numA = /^\d+$/.test(partA);
    const numB = /^\d+$/.test(partB);

    if (numA && numB) {
      const diff = Number(partA) - Number(partB);
      if (diff !== 0) return diff;
      if (partA.length !== partB.length) return partA.length - partB.length;
      continue;
    }

    if (numA !== numB) {
      return numA ? -1 : 1;
    }

    if (partA < partB) return -1;
    if (partA > partB) return 1;
  }

  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function writeAuditLog_(entity, entityId, action, beforeObj, afterObj, actorEmail) {
  const sheet = getSheetOrThrow_(SHEET_NAMES.AUDIT_LOG);
  const row = {
    log_id: uuid_(),
    entity: entity,
    entity_id: entityId,
    action: action,
    before_json: JSON.stringify(beforeObj || {}),
    after_json: JSON.stringify(afterObj || {}),
    acted_by: actorEmail,
    acted_at: nowStamp_()
  };
  sheet.appendRow(objectToOrderedRow_(row, AUDIT_HEADERS));
}

function assertRequired_(obj, fields) {
  const missing = [];
  fields.forEach(function (field) {
    if (!normalizeText_(obj[field])) {
      missing.push(field);
    }
  });
  if (missing.length > 0) {
    throw new AppError('VALIDATION', '必須項目が不足しています。', missing);
  }
}
