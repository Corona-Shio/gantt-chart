import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { MasterData, TaskDraft } from '../types';

interface TaskFormModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  masters: MasterData;
  initialDraft: TaskDraft;
  onClose: () => void;
  onSubmit: (draft: TaskDraft) => Promise<void>;
}

const REQUIRED_FIELDS: Array<keyof TaskDraft> = [
  'status',
  'channel',
  'assignee',
  'script_no',
  'task_type',
  'task_name',
  'start_date',
  'end_date'
];

export const TaskFormModal = ({
  open,
  mode,
  masters,
  initialDraft,
  onClose,
  onSubmit
}: TaskFormModalProps): JSX.Element | null => {
  const [draft, setDraft] = useState<TaskDraft>(initialDraft);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setDraft(initialDraft);
    setError('');
  }, [initialDraft]);

  const statusOptions = useMemo(
    () => masters.statuses.filter((v) => v.is_active).sort((a, b) => a.sort_order - b.sort_order),
    [masters.statuses]
  );

  const channelOptions = useMemo(
    () => masters.channels.filter((v) => v.is_active).sort((a, b) => a.sort_order - b.sort_order),
    [masters.channels]
  );

  const taskTypeOptions = useMemo(
    () => masters.taskTypes.filter((v) => v.is_active).sort((a, b) => a.sort_order - b.sort_order),
    [masters.taskTypes]
  );

  if (!open) {
    return null;
  }

  const updateField = (field: keyof TaskDraft, value: string): void => {
    setDraft((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError('');

    for (const field of REQUIRED_FIELDS) {
      if (!String(draft[field] ?? '').trim()) {
        setError(`必須項目が未入力です: ${field}`);
        return;
      }
    }

    if (draft.start_date > draft.end_date) {
      setError('開始日と終了日の整合が正しくありません。');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(draft);
    } catch (err) {
      const message = err instanceof Error ? err.message : '保存に失敗しました。';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-panel">
        <div className="modal-header">
          <h2>{mode === 'create' ? 'タスク作成' : 'タスク編集'}</h2>
          <button type="button" className="ghost-btn" onClick={onClose}>
            閉じる
          </button>
        </div>

        <form onSubmit={handleSubmit} className="task-form">
          <label>
            ステータス
            <select value={draft.status} onChange={(e) => updateField('status', e.target.value)} required>
              <option value="">選択してください</option>
              {statusOptions.map((status) => (
                <option key={status.status} value={status.status}>
                  {status.status}
                </option>
              ))}
            </select>
          </label>

          <label>
            チャンネル
            <select value={draft.channel} onChange={(e) => updateField('channel', e.target.value)} required>
              <option value="">選択してください</option>
              {channelOptions.map((channel) => (
                <option key={channel.channel} value={channel.channel}>
                  {channel.channel}
                </option>
              ))}
            </select>
          </label>

          <label>
            担当
            <input
              value={draft.assignee}
              onChange={(e) => updateField('assignee', e.target.value)}
              required
              maxLength={50}
            />
          </label>

          <label>
            脚本番号
            <input
              value={draft.script_no}
              onChange={(e) => updateField('script_no', e.target.value)}
              required
              maxLength={30}
            />
          </label>

          <label>
            タスク種
            <select
              value={draft.task_type}
              onChange={(e) => updateField('task_type', e.target.value)}
              required
            >
              <option value="">選択してください</option>
              {taskTypeOptions.map((taskType) => (
                <option key={taskType.task_type} value={taskType.task_type}>
                  {taskType.task_type}
                </option>
              ))}
            </select>
          </label>

          <label>
            タスク名
            <input
              value={draft.task_name}
              onChange={(e) => updateField('task_name', e.target.value)}
              required
              maxLength={120}
            />
          </label>

          <label>
            開始日
            <input
              type="date"
              value={draft.start_date}
              onChange={(e) => updateField('start_date', e.target.value)}
              required
            />
          </label>

          <label>
            終了日
            <input
              type="date"
              value={draft.end_date}
              onChange={(e) => updateField('end_date', e.target.value)}
              required
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="ghost-btn" onClick={onClose} disabled={submitting}>
              キャンセル
            </button>
            <button type="submit" className="primary-btn" disabled={submitting}>
              {submitting ? '保存中...' : mode === 'create' ? '作成する' : '更新する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
