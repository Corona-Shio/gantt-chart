import { compareScriptNo } from './scriptSort';
import type { Task } from '../types';

export const sortTasks = (tasks: Task[], channelOrder: string[] = []): Task[] => {
  const channelPriority = new Map<string, number>();
  channelOrder.forEach((channel, index) => {
    channelPriority.set(channel, index);
  });

  return [...tasks].sort((a, b) => {
    const aPriority = channelPriority.get(a.channel);
    const bPriority = channelPriority.get(b.channel);

    if (aPriority !== undefined && bPriority !== undefined && aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    if (aPriority !== undefined && bPriority === undefined) {
      return -1;
    }

    if (aPriority === undefined && bPriority !== undefined) {
      return 1;
    }

    const channelText = a.channel.localeCompare(b.channel, 'ja');
    if (channelText !== 0) {
      return channelText;
    }

    const scriptNo = compareScriptNo(a.script_no, b.script_no);
    if (scriptNo !== 0) {
      return scriptNo;
    }

    const start = a.start_date.localeCompare(b.start_date);
    if (start !== 0) {
      return start;
    }

    return a.task_name.localeCompare(b.task_name, 'ja');
  });
};
