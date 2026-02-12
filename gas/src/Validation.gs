function validateTaskPayload_(task, activeMasters) {
  const normalized = {
    status: normalizeText_(task.status),
    channel: normalizeText_(task.channel),
    assignee: normalizeText_(task.assignee),
    script_no: normalizeText_(task.script_no),
    task_type: normalizeText_(task.task_type),
    task_name: normalizeText_(task.task_name),
    start_date: normalizeDate_(task.start_date),
    end_date: normalizeDate_(task.end_date)
  };

  assertRequired_(normalized, TASK_REQUIRED_FIELDS);

  if (normalized.start_date > normalized.end_date) {
    throw new AppError('VALIDATION', '開始日が終了日より後になっています。', ['start_date', 'end_date']);
  }

  if (!activeMasters.channels.has(normalized.channel)) {
    throw new AppError('VALIDATION', 'チャンネルがマスタに存在しません。', ['channel']);
  }

  if (!activeMasters.taskTypes.has(normalized.task_type)) {
    throw new AppError('VALIDATION', 'タスク種がマスタに存在しません。', ['task_type']);
  }

  if (!activeMasters.statuses.has(normalized.status)) {
    throw new AppError('VALIDATION', 'ステータスがマスタに存在しません。', ['status']);
  }

  return normalized;
}

function validateReleaseDatePayload_(payload, activeMasters) {
  const normalized = {
    channel: normalizeText_(payload.channel),
    script_no: normalizeText_(payload.script_no),
    release_date: normalizeDate_(payload.release_date)
  };

  assertRequired_(normalized, ['channel', 'script_no', 'release_date']);

  if (!activeMasters.channels.has(normalized.channel)) {
    throw new AppError('VALIDATION', 'チャンネルがマスタに存在しません。', ['channel']);
  }

  return normalized;
}
