function getMasterData_() {
  const channels = rowsToObjects_(getSheetOrThrow_(SHEET_NAMES.MASTER_CHANNELS)).map(function (row) {
    return {
      channel: normalizeText_(row.channel),
      is_active: parseBoolean_(row.is_active),
      sort_order: toNumber_(row.sort_order, 9999)
    };
  });

  const taskTypes = rowsToObjects_(getSheetOrThrow_(SHEET_NAMES.MASTER_TASK_TYPES)).map(function (row) {
    return {
      task_type: normalizeText_(row.task_type),
      is_active: parseBoolean_(row.is_active),
      sort_order: toNumber_(row.sort_order, 9999)
    };
  });

  const statuses = rowsToObjects_(getSheetOrThrow_(SHEET_NAMES.MASTER_STATUSES)).map(function (row) {
    return {
      status: normalizeText_(row.status),
      is_active: parseBoolean_(row.is_active),
      sort_order: toNumber_(row.sort_order, 9999),
      color: normalizeText_(row.color) || '#6c757d'
    };
  });

  channels.sort(function (a, b) {
    return a.sort_order - b.sort_order;
  });

  taskTypes.sort(function (a, b) {
    return a.sort_order - b.sort_order;
  });

  statuses.sort(function (a, b) {
    return a.sort_order - b.sort_order;
  });

  return {
    channels: channels,
    taskTypes: taskTypes,
    statuses: statuses
  };
}

function getActiveMasterSets_() {
  const masters = getMasterData_();

  return {
    channels: new Set(
      masters.channels.filter(function (entry) {
        return entry.is_active;
      }).map(function (entry) {
        return entry.channel;
      })
    ),
    taskTypes: new Set(
      masters.taskTypes.filter(function (entry) {
        return entry.is_active;
      }).map(function (entry) {
        return entry.task_type;
      })
    ),
    statuses: new Set(
      masters.statuses.filter(function (entry) {
        return entry.is_active;
      }).map(function (entry) {
        return entry.status;
      })
    )
  };
}

function bootstrapGet_(user) {
  return {
    role: user.role,
    email: user.email,
    masters: getMasterData_()
  };
}
