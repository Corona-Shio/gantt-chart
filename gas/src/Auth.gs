function getCurrentUserOrThrow_() {
  const email = normalizeText_(Session.getActiveUser().getEmail()).toLowerCase();
  if (!email) {
    throw new AppError('FORBIDDEN', 'ログインユーザー情報を取得できません。');
  }

  const users = rowsToObjects_(getSheetOrThrow_(SHEET_NAMES.USERS));
  const user = users.find(function (row) {
    return normalizeText_(row.email).toLowerCase() === email;
  });

  if (!user || !parseBoolean_(user.is_active)) {
    throw new AppError('FORBIDDEN', '許可されていないユーザーです。');
  }

  const role = normalizeText_(user.role);
  if (role !== 'admin' && role !== 'editor' && role !== 'viewer') {
    throw new AppError('FORBIDDEN', 'ロール設定が不正です。');
  }

  return {
    email: email,
    role: role
  };
}

function requireEditorOrAdmin_(user) {
  if (user.role !== 'admin' && user.role !== 'editor') {
    throw new AppError('FORBIDDEN', '編集権限が必要です。');
  }
}

function requireAdmin_(user) {
  if (user.role !== 'admin') {
    throw new AppError('FORBIDDEN', '管理者権限が必要です。');
  }
}
