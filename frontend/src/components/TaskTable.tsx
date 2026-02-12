import type { Task } from '../types';

interface TaskTableProps {
  tasks: Task[];
  selectedTaskId: string | null;
  statusColors: Record<string, string>;
  canEdit: boolean;
  onSelect: (taskId: string) => void;
  onEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

export const TaskTable = ({
  tasks,
  selectedTaskId,
  statusColors,
  canEdit,
  onSelect,
  onEdit,
  onDelete
}: TaskTableProps): JSX.Element => {
  return (
    <div className="task-table-wrap">
      <table className="task-table">
        <thead>
          <tr>
            <th>ステータス</th>
            <th>チャンネル</th>
            <th>担当</th>
            <th>脚本番号</th>
            <th>タスク種</th>
            <th>タスク名</th>
            <th>開始日</th>
            <th>終了日</th>
            {canEdit && <th>操作</th>}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const selected = task.id === selectedTaskId;
            const color = statusColors[task.status] ?? '#7f8c8d';
            return (
              <tr
                key={task.id}
                className={selected ? 'selected' : ''}
                onClick={() => onSelect(task.id)}
                data-task-id={task.id}
              >
                <td>
                  <span className="status-chip" style={{ backgroundColor: color }}>
                    {task.status}
                  </span>
                </td>
                <td>{task.channel}</td>
                <td>{task.assignee}</td>
                <td>{task.script_no}</td>
                <td>{task.task_type}</td>
                <td>{task.task_name}</td>
                <td>{task.start_date}</td>
                <td>{task.end_date}</td>
                {canEdit && (
                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="ghost-btn"
                        onClick={(event) => {
                          event.stopPropagation();
                          onEdit(task.id);
                        }}
                      >
                        編集
                      </button>
                      <button
                        type="button"
                        className="danger-btn"
                        onClick={(event) => {
                          event.stopPropagation();
                          onDelete(task.id);
                        }}
                      >
                        削除
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {tasks.length === 0 && <p className="empty-note">表示対象のタスクはありません。</p>}
    </div>
  );
};
