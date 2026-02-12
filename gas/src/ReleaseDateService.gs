function rowToReleaseDate_(row) {
  return {
    channel: normalizeText_(row.channel),
    script_no: normalizeText_(row.script_no),
    release_date: row.release_date ? normalizeDate_(row.release_date) : '',
    updated_at: normalizeText_(row.updated_at),
    updated_by: normalizeText_(row.updated_by),
    __rowIndex: row.__rowIndex
  };
}

function listReleaseDates_(payload) {
  const filters = payload || {};
  const entries = rowsToObjects_(getSheetOrThrow_(SHEET_NAMES.RELEASE_DATES))
    .map(rowToReleaseDate_)
    .filter(function (entry) {
      if (filters.channel && normalizeText_(filters.channel) !== entry.channel) return false;
      if (filters.script_no && normalizeText_(filters.script_no) !== entry.script_no) return false;
      return true;
    });

  entries.sort(function (a, b) {
    if (a.channel < b.channel) return -1;
    if (a.channel > b.channel) return 1;

    const script = naturalCompare_(a.script_no, b.script_no);
    if (script !== 0) return script;

    if (a.release_date < b.release_date) return -1;
    if (a.release_date > b.release_date) return 1;
    return 0;
  });

  return entries.map(function (entry) {
    delete entry.__rowIndex;
    return entry;
  });
}

function upsertReleaseDate_(user, payload) {
  requireEditorOrAdmin_(user);

  const masters = getActiveMasterSets_();
  const normalized = validateReleaseDatePayload_(payload, masters);

  return withScriptLock_(function () {
    const sheet = getSheetOrThrow_(SHEET_NAMES.RELEASE_DATES);
    const rows = rowsToObjects_(sheet);

    const existingRaw = rows.find(function (row) {
      return (
        normalizeText_(row.channel) === normalized.channel && normalizeText_(row.script_no) === normalized.script_no
      );
    });

    const now = nowStamp_();
    const entry = {
      channel: normalized.channel,
      script_no: normalized.script_no,
      release_date: normalized.release_date,
      updated_at: now,
      updated_by: user.email
    };

    if (!existingRaw) {
      sheet.appendRow(objectToOrderedRow_(entry, RELEASE_DATE_HEADERS));
      writeAuditLog_(
        'release_dates',
        entry.channel + ':' + entry.script_no,
        'create',
        null,
        entry,
        user.email
      );
      return entry;
    }

    const before = rowToReleaseDate_(existingRaw);
    sheet
      .getRange(before.__rowIndex, 1, 1, RELEASE_DATE_HEADERS.length)
      .setValues([objectToOrderedRow_(entry, RELEASE_DATE_HEADERS)]);

    writeAuditLog_(
      'release_dates',
      entry.channel + ':' + entry.script_no,
      'update',
      before,
      entry,
      user.email
    );

    return entry;
  });
}
