import { useEffect, useMemo, useState } from 'react';
import { GanttView } from './components/GanttView';
import type { GanttViewMode } from './components/GanttView';
import { TaskFormModal } from './components/TaskFormModal';
import { TaskTable } from './components/TaskTable';
import { rpc, RpcError } from './lib/api';
import { todayJst } from './lib/date';
import { sortTasks } from './lib/taskSort';
import type { BootstrapData, MasterData, ReleaseDate, Task, TaskDraft, UserRole } from './types';

const CHANNEL_ALL = 'ALL';

const CHANNEL_COLOR_PALETTE = ['#ca6702', '#0077b6', '#588157', '#9b2226', '#6a4c93', '#3a86ff'];

interface ModalStateClosed {
  open: false;
}

interface ModalStateOpen {
  open: true;
  mode: 'create' | 'edit';
  draft: TaskDraft;
  taskId?: string;
  version?: number;
}

type ModalState = ModalStateClosed | ModalStateOpen;

const emptyMasterData: MasterData = {
  channels: [],
  taskTypes: [],
  statuses: []
};

const toDraft = (task: Task): TaskDraft => ({
  status: task.status,
  channel: task.channel,
  assignee: task.assignee,
  script_no: task.script_no,
  task_type: task.task_type,
  task_name: task.task_name,
  start_date: task.start_date,
  end_date: task.end_date
});

const canEditByRole = (role: UserRole | null): boolean => role === 'admin' || role === 'editor';

const buildDefaultDraft = (
  masters: MasterData,
  email: string,
  channel: string | null,
  dateRange?: { start_date: string; end_date: string }
): TaskDraft => {
  const firstStatus = masters.statuses.filter((v) => v.is_active).sort((a, b) => a.sort_order - b.sort_order)[0];
  const firstTaskType = masters.taskTypes
    .filter((v) => v.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)[0];
  const firstChannel = masters.channels.filter((v) => v.is_active).sort((a, b) => a.sort_order - b.sort_order)[0];

  const today = todayJst();

  return {
    status: firstStatus?.status ?? '',
    channel: channel && channel !== CHANNEL_ALL ? channel : firstChannel?.channel ?? '',
    assignee: email.split('@')[0] ?? '',
    script_no: '',
    task_type: firstTaskType?.task_type ?? '',
    task_name: '',
    start_date: dateRange?.start_date ?? today,
    end_date: dateRange?.end_date ?? today
  };
};

export const App = (): JSX.Element => {
  const [masters, setMasters] = useState<MasterData>(emptyMasterData);
  const [role, setRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [releaseDates, setReleaseDates] = useState<ReleaseDate[]>([]);
  const [selectedChannel, setSelectedChannel] = useState(CHANNEL_ALL);
  const [ganttViewMode, setGanttViewMode] = useState<GanttViewMode>('day');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [modalState, setModalState] = useState<ModalState>({ open: false });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [bannerMessage, setBannerMessage] = useState('');
  const [releaseScriptNo, setReleaseScriptNo] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [releaseChannel, setReleaseChannel] = useState('');
  const [importSourceSheet, setImportSourceSheet] = useState('ImportTasks');

  const canEdit = canEditByRole(role);
  const isAdmin = role === 'admin';

  const channels = useMemo(
    () => masters.channels.filter((v) => v.is_active).sort((a, b) => a.sort_order - b.sort_order).map((v) => v.channel),
    [masters.channels]
  );

  useEffect(() => {
    if (!releaseChannel && channels.length > 0) {
      setReleaseChannel(channels[0]);
    }
  }, [channels, releaseChannel]);

  useEffect(() => {
    if (selectedChannel !== CHANNEL_ALL) {
      setReleaseChannel(selectedChannel);
    }
  }, [selectedChannel]);

  const channelColors = useMemo(() => {
    const map: Record<string, string> = {};
    channels.forEach((channel, index) => {
      map[channel] = CHANNEL_COLOR_PALETTE[index % CHANNEL_COLOR_PALETTE.length];
    });
    return map;
  }, [channels]);

  const statusColors = useMemo(() => {
    const map: Record<string, string> = {};
    for (const status of masters.statuses) {
      map[status.status] = status.color;
    }
    return map;
  }, [masters.statuses]);

  const visibleChannels = useMemo(
    () => (selectedChannel === CHANNEL_ALL ? channels : channels.filter((channel) => channel === selectedChannel)),
    [channels, selectedChannel]
  );

  const visibleTasks = useMemo(() => {
    const scoped = selectedChannel === CHANNEL_ALL ? tasks : tasks.filter((task) => task.channel === selectedChannel);
    return sortTasks(scoped);
  }, [selectedChannel, tasks]);

  const visibleReleaseDates = useMemo(
    () =>
      selectedChannel === CHANNEL_ALL
        ? releaseDates
        : releaseDates.filter((releaseEntry) => releaseEntry.channel === selectedChannel),
    [releaseDates, selectedChannel]
  );

  const refreshData = async (): Promise<void> => {
    const [tasksResult, releaseResult] = await Promise.all([
      rpc<Task[]>('tasks.list', {}),
      rpc<ReleaseDate[]>('releaseDates.list', {})
    ]);

    setTasks(tasksResult);
    setReleaseDates(releaseResult);
  };

  const loadInitial = async (): Promise<void> => {
    setLoading(true);
    setErrorMessage('');

    try {
      const bootstrap = await rpc<BootstrapData>('bootstrap.get', {});
      setRole(bootstrap.role);
      setEmail(bootstrap.email);
      setMasters(bootstrap.masters);
      await refreshData();
    } catch (err) {
      const message = err instanceof Error ? err.message : '初期データの取得に失敗しました。';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitial().catch(() => {
      setErrorMessage('初期化に失敗しました。');
      setLoading(false);
    });
  }, []);

  const handleCreateClick = (): void => {
    setModalState({
      open: true,
      mode: 'create',
      draft: buildDefaultDraft(masters, email, selectedChannel)
    });
  };

  const handleCreateByRange = (range: { channel: string; start_date: string; end_date: string }): void => {
    setModalState({
      open: true,
      mode: 'create',
      draft: buildDefaultDraft(masters, email, range.channel, range)
    });
  };

  const handleEdit = (taskId: string): void => {
    const target = tasks.find((task) => task.id === taskId);
    if (!target) {
      return;
    }

    setModalState({
      open: true,
      mode: 'edit',
      draft: toDraft(target),
      taskId: target.id,
      version: target.version
    });
  };

  const handleDelete = async (taskId: string): Promise<void> => {
    const target = tasks.find((task) => task.id === taskId);
    if (!target) {
      return;
    }

    const confirmed = window.confirm(`タスク「${target.task_name}」を削除しますか？`);
    if (!confirmed) {
      return;
    }

    try {
      await rpc<{ id: string }>('tasks.delete', {
        id: target.id,
        version: target.version
      });
      await refreshData();
      if (selectedTaskId === taskId) {
        setSelectedTaskId(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '削除に失敗しました。';
      setBannerMessage(message);
    }
  };

  const submitModal = async (draft: TaskDraft): Promise<void> => {
    if (!modalState.open) {
      return;
    }

    if (modalState.mode === 'create') {
      await rpc<Task>('tasks.create', {
        task: draft
      });
    } else {
      await rpc<Task>('tasks.update', {
        id: modalState.taskId,
        version: modalState.version,
        task: draft
      });
    }

    setModalState({ open: false });
    await refreshData();
  };

  const handleMoveTask = async (taskId: string, startDate: string, endDate: string): Promise<void> => {
    const target = tasks.find((task) => task.id === taskId);
    if (!target) {
      throw new Error('移動対象のタスクが見つかりません。');
    }

    try {
      await rpc<Task>('tasks.update', {
        id: target.id,
        version: target.version,
        task: {
          start_date: startDate,
          end_date: endDate
        }
      });

      await refreshData();
    } catch (err) {
      if (err instanceof RpcError && err.code === 'CONFLICT') {
        setBannerMessage('他ユーザーの更新と競合しました。最新データに更新しました。');
        await refreshData();
      }
      throw err;
    }
  };

  const handleReleaseUpsert = async (): Promise<void> => {
    if (!releaseChannel || !releaseScriptNo || !releaseDate) {
      setBannerMessage('公開日登録に必要な項目を入力してください。');
      return;
    }

    try {
      await rpc<ReleaseDate>('releaseDates.upsert', {
        channel: releaseChannel,
        script_no: releaseScriptNo,
        release_date: releaseDate
      });
      setReleaseScriptNo('');
      setReleaseDate('');
      await refreshData();
    } catch (err) {
      const message = err instanceof Error ? err.message : '公開日更新に失敗しました。';
      setBannerMessage(message);
    }
  };

  const handleInitialImport = async (): Promise<void> => {
    if (!importSourceSheet.trim()) {
      setBannerMessage('取込元シート名を入力してください。');
      return;
    }

    try {
      const result = await rpc<{ imported: number; skipped: number }>('import.initialFromSheet', {
        sourceSheetName: importSourceSheet.trim()
      });
      setBannerMessage(`インポート完了: imported=${result.imported} skipped=${result.skipped}`);
      await refreshData();
    } catch (err) {
      const message = err instanceof Error ? err.message : '初回インポートに失敗しました。';
      setBannerMessage(message);
    }
  };

  if (loading) {
    return <div className="loading-screen">Loading scheduler...</div>;
  }

  if (errorMessage) {
    return (
      <div className="error-screen">
        <h1>初期化エラー</h1>
        <p>{errorMessage}</p>
        <button type="button" className="primary-btn" onClick={loadInitial}>
          再試行
        </button>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="app-kicker">Anime Team Control Board</p>
          <h1>Production Schedule Workspace</h1>
        </div>
        <div className="user-pill">
          <span className="role">{role}</span>
          <span>{email}</span>
        </div>
      </header>

      <section className="toolbar">
        <div className="channel-tabs" role="tablist" aria-label="channel selector">
          <button
            type="button"
            className={selectedChannel === CHANNEL_ALL ? 'tab active' : 'tab'}
            onClick={() => setSelectedChannel(CHANNEL_ALL)}
          >
            全体
          </button>
          {channels.map((channel) => (
            <button
              key={channel}
              type="button"
              className={selectedChannel === channel ? 'tab active' : 'tab'}
              onClick={() => setSelectedChannel(channel)}
            >
              {channel}
            </button>
          ))}
        </div>

        <div className="toolbar-actions">
          <div className="view-mode-switch" role="group" aria-label="gantt view mode">
            <button
              type="button"
              className={ganttViewMode === 'day' ? 'tab active' : 'tab'}
              onClick={() => setGanttViewMode('day')}
            >
              日次
            </button>
            <button
              type="button"
              className={ganttViewMode === 'month' ? 'tab active' : 'tab'}
              onClick={() => setGanttViewMode('month')}
            >
              月次
            </button>
          </div>
          {canEdit && (
            <button type="button" className="primary-btn" onClick={handleCreateClick}>
              新規タスク
            </button>
          )}
          <button type="button" className="ghost-btn" onClick={() => refreshData()}>
            最新化
          </button>
        </div>
      </section>

      {bannerMessage && <div className="banner-warning">{bannerMessage}</div>}

      <section className="meta-panel">
        <div className="meta-block">
          <h2>公開日登録</h2>
          <div className="inline-form">
            <select
              value={releaseChannel}
              onChange={(event) => setReleaseChannel(event.target.value)}
              disabled={!canEdit}
            >
              {channels.map((channel) => (
                <option key={channel} value={channel}>
                  {channel}
                </option>
              ))}
            </select>
            <input
              placeholder="脚本番号"
              value={releaseScriptNo}
              onChange={(event) => setReleaseScriptNo(event.target.value)}
              disabled={!canEdit}
            />
            <input
              type="date"
              value={releaseDate}
              onChange={(event) => setReleaseDate(event.target.value)}
              disabled={!canEdit}
            />
            <button type="button" className="ghost-btn" onClick={handleReleaseUpsert} disabled={!canEdit}>
              保存
            </button>
          </div>
        </div>

        {isAdmin && (
          <div className="meta-block">
            <h2>初回インポート</h2>
            <div className="inline-form">
              <input
                placeholder="取り込み元シート名"
                value={importSourceSheet}
                onChange={(event) => setImportSourceSheet(event.target.value)}
              />
              <button type="button" className="ghost-btn" onClick={handleInitialImport}>
                実行
              </button>
            </div>
          </div>
        )}
      </section>

      <main className="workspace-stage">
        <section className="workspace-head">
          <div className="workspace-head-block">
            <p className="workspace-head-kicker">Table Side</p>
            <h2>タスク編集ビュー</h2>
          </div>
          <div className="workspace-head-block main">
            <p className="workspace-head-kicker">Main View</p>
            <h2>ガントチャート</h2>
          </div>
        </section>
        <p className="workspace-hint">左のタスク編集内容が右のガントに反映されます。選択状態は左右で同期します。</p>

        <section className="workspace-grid">
          <section className="table-panel">
            <TaskTable
              tasks={visibleTasks}
              selectedTaskId={selectedTaskId}
              statusColors={statusColors}
              canEdit={canEdit}
              onSelect={setSelectedTaskId}
              onEdit={handleEdit}
              onDelete={(taskId) => {
                handleDelete(taskId).catch(() => {
                  setBannerMessage('削除に失敗しました。');
                });
              }}
            />
          </section>

          <section className="gantt-panel">
            <GanttView
              channels={visibleChannels}
              tasks={visibleTasks}
              releaseDates={visibleReleaseDates}
              viewMode={ganttViewMode}
              selectedTaskId={selectedTaskId}
              canEdit={canEdit}
              channelColors={channelColors}
              onSelectTask={setSelectedTaskId}
              onRequestCreate={handleCreateByRange}
              onRequestMove={handleMoveTask}
            />
          </section>
        </section>
      </main>

      {modalState.open && (
        <TaskFormModal
          open={modalState.open}
          mode={modalState.mode}
          masters={masters}
          initialDraft={modalState.draft}
          onClose={() => setModalState({ open: false })}
          onSubmit={submitModal}
        />
      )}
    </div>
  );
};
