function createTasksBackupSnapshot() {
  return withScriptLock_(function () {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const source = getSheetOrThrow_(SHEET_NAMES.TASKS);
    const stamp = Utilities.formatDate(new Date(), APP_TZ, 'yyyyMMdd');
    const backupName = 'backup_tasks_' + stamp;

    let backup = ss.getSheetByName(backupName);
    if (!backup) {
      backup = ss.insertSheet(backupName);
    } else {
      backup.clearContents();
    }

    const values = source.getDataRange().getValues();
    if (values.length > 0) {
      backup.getRange(1, 1, values.length, values[0].length).setValues(values);
      backup.setFrozenRows(1);
    }

    return {
      sheet: backupName,
      rows: values.length
    };
  });
}

function createDailyBackupTrigger() {
  const functionName = 'createTasksBackupSnapshot';

  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === functionName) {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger(functionName).timeBased().everyDays(1).atHour(1).inTimezone(APP_TZ).create();
}

function removeDailyBackupTrigger() {
  const functionName = 'createTasksBackupSnapshot';

  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === functionName) {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}
