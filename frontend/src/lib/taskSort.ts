import { compareScriptNo } from './scriptSort';
import type { Task } from '../types';

export const sortTasks = (tasks: Task[]): Task[] => {
  return [...tasks].sort((a, b) => {
    const channel = a.channel.localeCompare(b.channel, 'ja');
    if (channel !== 0) {
      return channel;
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
