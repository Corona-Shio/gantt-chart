function rowToTask_(row) {
  return {
    id: normalizeText_(row.id),
    version: toNumber_(row.version, 1),
    status: normalizeText_(row.status),
    channel: normalizeText_(row.channel),
    assignee: normalizeText_(row.assignee),
    script_no: normalizeText_(row.script_no),
    task_type: normalizeText_(row.task_type),
    task_name: normalizeText_(row.task_name),
    start_date: row.start_date ? normalizeDate_(row.start_date) : '',
    end_date: row.end_date ? normalizeDate_(row.end_date) : '',
    deleted_at: normalizeText_(row.deleted_at),
    created_at: normalizeText_(row.created_at),
    created_by: normalizeText_(row.created_by),
    updated_at: normalizeText_(row.updated_at),
    updated_by: normalizeText_(row.updated_by),
    __rowIndex: row.__rowIndex
  };
}

function sortTasks_(tasks) {
  tasks.sort(function (a, b) {
    if (a.channel < b.channel) return -1;
    if (a.channel > b.channel) return 1;

    const script = naturalCompare_(a.script_no, b.script_no);
    if (script !== 0) return script;

    if (a.start_date < b.start_date) return -1;
    if (a.start_date > b.start_date) return 1;

    if (a.task_name < b.task_name) return -1;
    if (a.task_name > b.task_name) return 1;
    return 0;
  });
}

function listTasks_(payload) {
  const filters = payload || {};
  const tasks = rowsToObjects_(getSheetOrThrow_(SHEET_NAMES.TASKS))
    .map(rowToTask_)
    .filter(function (task) {
      return !task.deleted_at;
    })
    .filter(function (task) {
      if (filters.channel && normalizeText_(filters.channel) !== task.channel) return false;
      if (filters.status && normalizeText_(filters.status) !== task.status) return false;
      if (filters.assignee && normalizeText_(filters.assignee) !== task.assignee) return false;
      if (filters.script_no && normalizeText_(filters.script_no) !== task.script_no) return false;

      const from = filters.date_from ? normalizeDate_(filters.date_from) : '';
      const to = filters.date_to ? normalizeDate_(filters.date_to) : '';

      if (from && task.end_date && task.end_date < from) return false;
      if (to && task.start_date && task.start_date > to) return false;

      return true;
    })
    .map(function (task) {
      delete task.__rowIndex;
      return task;
    });

  sortTasks_(tasks);
  return tasks;
}

function createTask_(user, payload) {
  requireEditorOrAdmin_(user);

  const taskPayload = payload.task || payload;
  const masters = getActiveMasterSets_();
  const normalized = validateTaskPayload_(taskPayload, masters);

  return withScriptLock_(function () {
    const sheet = getSheetOrThrow_(SHEET_NAMES.TASKS);
    const now = nowStamp_();
    const created = {
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
    };

    sheet.appendRow(objectToOrderedRow_(created, TASK_HEADERS));
    writeAuditLog_('tasks', created.id, 'create', null, created, user.email);
    return created;
  });
}

function findTaskByIdOrThrow_(rows, id) {
  const found = rows.find(function (row) {
    return normalizeText_(row.id) === id;
  });

  if (!found) {
    throw new AppError('NOT_FOUND', 'タスクが見つかりません。');
  }

  return found;
}

function updateTask_(user, payload) {
  requireEditorOrAdmin_(user);

  const id = normalizeText_(payload.id);
  const version = toNumber_(payload.version, NaN);
  if (!id || Number.isNaN(version)) {
    throw new AppError('VALIDATION', 'id/version が必要です。', ['id', 'version']);
  }

  const patch = payload.task || {};

  return withScriptLock_(function () {
    const sheet = getSheetOrThrow_(SHEET_NAMES.TASKS);
    const rows = rowsToObjects_(sheet);
    const existingRow = findTaskByIdOrThrow_(rows, id);
    const existing = rowToTask_(existingRow);

    if (existing.deleted_at) {
      throw new AppError('NOT_FOUND', '削除済みタスクです。');
    }

    if (existing.version !== version) {
      throw new AppError('CONFLICT', '他ユーザーの更新と競合しました。');
    }

    const mergedPayload = {
      status: patch.status !== undefined ? patch.status : existing.status,
      channel: patch.channel !== undefined ? patch.channel : existing.channel,
      assignee: patch.assignee !== undefined ? patch.assignee : existing.assignee,
      script_no: patch.script_no !== undefined ? patch.script_no : existing.script_no,
      task_type: patch.task_type !== undefined ? patch.task_type : existing.task_type,
      task_name: patch.task_name !== undefined ? patch.task_name : existing.task_name,
      start_date: patch.start_date !== undefined ? patch.start_date : existing.start_date,
      end_date: patch.end_date !== undefined ? patch.end_date : existing.end_date
    };

    const masters = getActiveMasterSets_();
    const normalized = validateTaskPayload_(mergedPayload, masters);

    const updated = {
      id: existing.id,
      version: existing.version + 1,
      status: normalized.status,
      channel: normalized.channel,
      assignee: normalized.assignee,
      script_no: normalized.script_no,
      task_type: normalized.task_type,
      task_name: normalized.task_name,
      start_date: normalized.start_date,
      end_date: normalized.end_date,
      deleted_at: existing.deleted_at,
      created_at: existing.created_at,
      created_by: existing.created_by,
      updated_at: nowStamp_(),
      updated_by: user.email
    };

    sheet
      .getRange(existing.__rowIndex, 1, 1, TASK_HEADERS.length)
      .setValues([objectToOrderedRow_(updated, TASK_HEADERS)]);

    writeAuditLog_('tasks', existing.id, 'update', existing, updated, user.email);
    return updated;
  });
}

function deleteTask_(user, payload) {
  requireEditorOrAdmin_(user);

  const id = normalizeText_(payload.id);
  const version = toNumber_(payload.version, NaN);
  if (!id || Number.isNaN(version)) {
    throw new AppError('VALIDATION', 'id/version が必要です。', ['id', 'version']);
  }

  return withScriptLock_(function () {
    const sheet = getSheetOrThrow_(SHEET_NAMES.TASKS);
    const rows = rowsToObjects_(sheet);
    const existingRow = findTaskByIdOrThrow_(rows, id);
    const existing = rowToTask_(existingRow);

    if (existing.deleted_at) {
      throw new AppError('NOT_FOUND', '削除済みタスクです。');
    }

    if (existing.version !== version) {
      throw new AppError('CONFLICT', '他ユーザーの更新と競合しました。');
    }

    const deleted = {
      id: existing.id,
      version: existing.version + 1,
      status: existing.status,
      channel: existing.channel,
      assignee: existing.assignee,
      script_no: existing.script_no,
      task_type: existing.task_type,
      task_name: existing.task_name,
      start_date: existing.start_date,
      end_date: existing.end_date,
      deleted_at: nowStamp_(),
      created_at: existing.created_at,
      created_by: existing.created_by,
      updated_at: nowStamp_(),
      updated_by: user.email
    };

    sheet
      .getRange(existing.__rowIndex, 1, 1, TASK_HEADERS.length)
      .setValues([objectToOrderedRow_(deleted, TASK_HEADERS)]);

    writeAuditLog_('tasks', existing.id, 'delete', existing, deleted, user.email);
    return {
      id: existing.id
    };
  });
}
