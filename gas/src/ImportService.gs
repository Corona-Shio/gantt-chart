function normalizeHeaderKey_(value) {
  return normalizeText_(value).toLowerCase().replace(/\s+/g, '');
}

function resolveColumnMap_(headers) {
  const normalizedHeaders = headers.map(normalizeHeaderKey_);

  function findIndex(candidates) {
    for (let i = 0; i < candidates.length; i += 1) {
      const idx = normalizedHeaders.indexOf(normalizeHeaderKey_(candidates[i]));
      if (idx >= 0) return idx;
    }
    return -1;
  }

  const map = {
    status: findIndex(['ステータス', 'status']),
    channel: findIndex(['チャンネル', 'channel']),
    assignee: findIndex(['担当', 'assignee']),
    script_no: findIndex(['脚本番号', 'script_no', 'scriptno']),
    task_type: findIndex(['タスク種', 'task_type', 'tasktype']),
    task_name: findIndex(['タスク名', 'task_name', 'taskname']),
    start_date: findIndex(['開始日', 'start_date', 'startdate']),
    end_date: findIndex(['終了日', 'end_date', 'enddate'])
  };

  const missing = Object.keys(map).filter(function (key) {
    return map[key] < 0;
  });

  if (missing.length > 0) {
    throw new AppError('VALIDATION', '取込元シートの列が不足しています。', missing);
  }

  return map;
}

function importInitialFromSheet_(user, payload) {
  requireAdmin_(user);

  const sourceSheetName = normalizeText_(payload.sourceSheetName || 'ImportTasks');
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = ss.getSheetByName(sourceSheetName);
  if (!sourceSheet) {
    throw new AppError('NOT_FOUND', '取込元シートが見つかりません: ' + sourceSheetName);
  }

  const values = sourceSheet.getDataRange().getValues();
  if (values.length <= 1) {
    return { imported: 0, skipped: 0 };
  }

  const columnMap = resolveColumnMap_(values[0]);
  const masters = getActiveMasterSets_();
  const now = nowStamp_();

  const toInsert = [];
  let skipped = 0;

  values.slice(1).forEach(function (row) {
    const candidate = {
      status: row[columnMap.status],
      channel: row[columnMap.channel],
      assignee: row[columnMap.assignee],
      script_no: row[columnMap.script_no],
      task_type: row[columnMap.task_type],
      task_name: row[columnMap.task_name],
      start_date: row[columnMap.start_date],
      end_date: row[columnMap.end_date]
    };

    const allBlank = TASK_REQUIRED_FIELDS.every(function (field) {
      return !normalizeText_(candidate[field]);
    });

    if (allBlank) {
      skipped += 1;
      return;
    }

    try {
      const normalized = validateTaskPayload_(candidate, masters);
      toInsert.push({
        id: uuid_(),
        version: 1,
        status: normalized.status,
        channel: normalized.channel,
        assignee: normalized.assignee,
        script_no: normalized.script_no,
        task_type: normalized.task_type,
        task_name: normalized.task_name,
        start_date: normalized.start_date,
        end_date: normalized.end_date,
        deleted_at: '',
        created_at: now,
        created_by: user.email,
        updated_at: now,
        updated_by: user.email
      });
    } catch (_err) {
      skipped += 1;
    }
  });

  if (toInsert.length === 0) {
    return {
      imported: 0,
      skipped: skipped
    };
  }

  return withScriptLock_(function () {
    const sheet = getSheetOrThrow_(SHEET_NAMES.TASKS);
    const range = sheet.getRange(sheet.getLastRow() + 1, 1, toInsert.length, TASK_HEADERS.length);
    range.setValues(
      toInsert.map(function (item) {
        return objectToOrderedRow_(item, TASK_HEADERS);
      })
    );

    toInsert.forEach(function (task) {
      writeAuditLog_('tasks', task.id, 'create', null, task, user.email);
    });

    return {
      imported: toInsert.length,
      skipped: skipped
    };
  });
}
