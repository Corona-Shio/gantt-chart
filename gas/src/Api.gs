function doGet() {
  let htmlFileName = 'Index';
  try {
    HtmlService.createHtmlOutputFromFile('Index');
  } catch (_err) {
    htmlFileName = 'src/Index';
  }

  const htmlOutput = HtmlService.createHtmlOutputFromFile(htmlFileName);
  const apiBaseUrl = ScriptApp.getService().getUrl();
  const configLine =
    "window.__APP_CONFIG__ = window.__APP_CONFIG__ || {};window.__APP_CONFIG__.apiBaseUrl = " +
    JSON.stringify(apiBaseUrl) +
    ';';
  const content = htmlOutput
    .getContent()
    .replace('window.__APP_CONFIG__ = window.__APP_CONFIG__ || {};', configLine);

  return HtmlService.createHtmlOutput(content)
    .setTitle('Anime Production Scheduler')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  try {
    const req = parseRequestBody_(e);
    const result = handleRpc_(req.action, req.payload);
    if (result.ok) {
      return jsonSuccess_(result.data);
    }
    return jsonError_(result.error.code, result.error.message, result.error.fields);
  } catch (err) {
    if (err instanceof AppError) {
      return jsonError_(err.code, err.message, err.fields || []);
    }

    console.error(err);
    return jsonError_('INTERNAL', 'サーバー内部エラーが発生しました。');
  }
}

function rpc(action, payload, requestId) {
  const _ = requestId;
  const result = handleRpc_(action, payload || {});
  if (result.ok) {
    return result;
  }
  return result;
}

function handleRpc_(action, payload) {
  try {
    const user = getCurrentUserOrThrow_();
    const data = routeAction_(action, payload || {}, user);
    return {
      ok: true,
      data: data
    };
  } catch (err) {
    if (err instanceof AppError) {
      return {
        ok: false,
        error: {
          code: err.code,
          message: err.message,
          fields: err.fields || []
        }
      };
    }
    console.error(err);
    return {
      ok: false,
      error: {
        code: 'INTERNAL',
        message: 'サーバー内部エラーが発生しました。',
        fields: []
      }
    };
  }
}

function routeAction_(action, payload, user) {
  switch (action) {
    case 'bootstrap.get':
      return bootstrapGet_(user);

    case 'tasks.list':
      return listTasks_(payload);

    case 'tasks.create':
      return createTask_(user, payload);

    case 'tasks.update':
      return updateTask_(user, payload);

    case 'tasks.delete':
      return deleteTask_(user, payload);

    case 'releaseDates.list':
      return listReleaseDates_(payload);

    case 'releaseDates.upsert':
      return upsertReleaseDate_(user, payload);

    case 'import.initialFromSheet':
      return importInitialFromSheet_(user, payload);

    default:
      throw new AppError('NOT_FOUND', '未対応のactionです: ' + action);
  }
}
