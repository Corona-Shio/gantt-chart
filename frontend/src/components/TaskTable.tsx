import { Fragment } from 'react';
import type { Task } from '../types';

interface TaskTableProps {
  tasks: Task[];
  channelOrder: string[];
  selectedTaskId: string | null;
  statusColors: Record<string, string>;
  canEdit: boolean;
  onSelect: (taskId: string) => void;
  onEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

const toMonthDay = (date: string): string => {
  const [, month = '', day = ''] = date.split('-');
  return `${month}/${day}`;
};

export const TaskTable = ({
  tasks,
  channelOrder,
  selectedTaskId,
  statusColors,
  canEdit,
  onSelect,
  onEdit,
  onDelete
}: TaskTableProps): JSX.Element => {
  const channelMap = new Map<string, Task[]>();
  for (const task of tasks) {
    const bucket = channelMap.get(task.channel);
    if (bucket) {
      bucket.push(task);
      continue;
    }
    channelMap.set(task.channel, [task]);
  }
  const channelBuckets = channelOrder
    .map((channel) => {
      const bucketTasks = channelMap.get(channel);
      if (!bucketTasks || bucketTasks.length === 0) {
        return null;
      }
      channelMap.delete(channel);
      return {
        channel,
        tasks: bucketTasks
      };
    })
    .filter((bucket): bucket is { channel: string; tasks: Task[] } => bucket !== null);

  for (const [channel, bucketTasks] of channelMap.entries()) {
    channelBuckets.push({
      channel,
      tasks: bucketTasks
    });
  }

  return (
    <div className="task-table-wrap">
      <table className="task-table">
        <thead>
          <tr>
            <th>ステータス</th>
            <th>担当</th>
            <th>脚本番号</th>
            <th>タスク種</th>
            <th>タスク名</th>
            <th>期間</th>
            {canEdit && <th>操作</th>}
          </tr>
        </thead>
        <tbody>
          {channelBuckets.map((bucket) => (
            <Fragment key={`channel:${bucket.channel}`}>
              <tr className="channel-divider">
                <td colSpan={canEdit ? 7 : 6}>
                  <span className="channel-divider-label">{bucket.channel}</span>
                  <span className="channel-divider-count">{bucket.tasks.length}件</span>
                </td>
              </tr>
              {bucket.tasks.map((task) => {
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
                    <td>{task.assignee}</td>
                    <td>{task.script_no}</td>
                    <td>{task.task_type}</td>
                    <td>{task.task_name}</td>
                    <td className="date-range-cell">
                      {toMonthDay(task.start_date)} - {toMonthDay(task.end_date)}
                    </td>
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
            </Fragment>
          ))}
        </tbody>
      </table>

      {tasks.length === 0 && <p className="empty-note">表示対象のタスクはありません。</p>}
    </div>
  );
};
