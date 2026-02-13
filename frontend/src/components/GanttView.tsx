import { useEffect, useMemo, useRef } from 'react';
import { DataSet } from 'vis-data';
import { Timeline } from 'vis-timeline/standalone';
import { addDays, clampDateRange, floorTimelineDateToJst, toTimelineEndExclusive, toTimelineStart } from '../lib/date';
import type { ReleaseDate, Task } from '../types';

interface GanttCreateDraft {
  channel: string;
  start_date: string;
  end_date: string;
}

interface GanttViewProps {
  channels: string[];
  tasks: Task[];
  releaseDates: ReleaseDate[];
  viewMode: GanttViewMode;
  selectedTaskId: string | null;
  canEdit: boolean;
  channelColors: Record<string, string>;
  onSelectTask: (taskId: string | null) => void;
  onRequestCreate: (draft: GanttCreateDraft) => void;
  onRequestMove: (taskId: string, startDate: string, endDate: string) => Promise<void>;
}

interface DragState {
  group: string;
  startDate: string;
}

const toTaskItemId = (taskId: string): string => `task:${taskId}`;
const fromTaskItemId = (itemId: string): string => itemId.replace(/^task:/, '');
const DAY_MS = 1000 * 60 * 60 * 24;
const DEFAULT_DAY_WINDOW_DAYS = 31;
const DEFAULT_MONTH_WINDOW_DAYS = 365;

export type GanttViewMode = 'day' | 'month';

const buildTimelineModeOptions = (viewMode: GanttViewMode): Record<string, unknown> => {
  if (viewMode === 'month') {
    return {
      timeAxis: {
        scale: 'month',
        step: 1
      },
      zoomMin: DAY_MS * 30,
      zoomMax: DAY_MS * 365 * 4,
      format: {
        minorLabels: {
          month: 'M月'
        },
        majorLabels: {
          month: 'YYYY年'
        }
      }
    };
  }

  return {
    timeAxis: {
      scale: 'day',
      step: 1
    },
    zoomMin: DAY_MS * 21,
    zoomMax: DAY_MS * 365 * 2,
    format: {
      minorLabels: {
        day: 'D'
      },
      majorLabels: {
        day: 'YYYY年M月'
      }
    }
  };
};

export const GanttView = ({
  channels,
  tasks,
  releaseDates,
  viewMode,
  selectedTaskId,
  canEdit,
  channelColors,
  onSelectTask,
  onRequestCreate,
  onRequestMove
}: GanttViewProps): JSX.Element => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<Timeline | null>(null);
  const itemsRef = useRef(new DataSet<Record<string, unknown>>([]));
  const groupsRef = useRef(new DataSet<Record<string, unknown>>([]));
  const dragStateRef = useRef<DragState | null>(null);
  const fittedOnceRef = useRef(false);

  const groupIdSet = useMemo(() => new Set(channels), [channels]);

  useEffect(() => {
    if (!containerRef.current || timelineRef.current) {
      return;
    }

    const options: Record<string, unknown> = {
      stack: true,
      orientation: 'top',
      horizontalScroll: true,
      verticalScroll: true,
      zoomKey: 'ctrlKey',
      maxHeight: '100%',
      margin: {
        item: 12,
        axis: 8
      },
      ...buildTimelineModeOptions(viewMode),
      editable: canEdit
        ? {
            updateTime: true,
            updateGroup: false,
            add: false,
            remove: false
          }
        : false,
      onMove: (item: Record<string, unknown>, callback: (payload: Record<string, unknown> | null) => void) => {
        const itemId = String(item.id ?? '');
        if (!canEdit || !itemId.startsWith('task:')) {
          callback(null);
          return;
        }

        const start = item.start instanceof Date ? item.start : new Date(String(item.start));
        const endExclusive = item.end instanceof Date ? item.end : new Date(String(item.end));

        const startDate = floorTimelineDateToJst(start);
        const endDate = floorTimelineDateToJst(addDays(endExclusive, -1));

        onRequestMove(fromTaskItemId(itemId), startDate, endDate)
          .then(() => callback(item))
          .catch(() => callback(null));
      }
    };

    const timeline = new Timeline(containerRef.current, itemsRef.current, groupsRef.current, options);

    timeline.on('select', (props) => {
      const selected = Array.isArray(props.items) ? (props.items[0] as string | undefined) : undefined;
      if (!selected || !selected.startsWith('task:')) {
        onSelectTask(null);
        return;
      }
      onSelectTask(fromTaskItemId(selected));
    });

    timeline.on('mouseDown', (props) => {
      if (!canEdit || props.what !== 'background') {
        dragStateRef.current = null;
        return;
      }

      const group = String(props.group ?? '');
      if (!groupIdSet.has(group)) {
        dragStateRef.current = null;
        return;
      }

      const time = props.time instanceof Date ? props.time : new Date(String(props.time));
      dragStateRef.current = {
        group,
        startDate: floorTimelineDateToJst(time)
      };
    });

    timeline.on('mouseUp', (props) => {
      if (!canEdit) {
        dragStateRef.current = null;
        return;
      }

      const dragState = dragStateRef.current;
      dragStateRef.current = null;

      if (!dragState || props.what !== 'background') {
        return;
      }

      const group = String(props.group ?? '');
      if (group !== dragState.group) {
        return;
      }

      const time = props.time instanceof Date ? props.time : new Date(String(props.time));
      const endDate = floorTimelineDateToJst(time);
      const range = clampDateRange(dragState.startDate, endDate);

      onRequestCreate({
        channel: dragState.group,
        start_date: range.start,
        end_date: range.end
      });
    });

    timelineRef.current = timeline;

    return () => {
      timeline.destroy();
      timelineRef.current = null;
    };
  }, [canEdit, groupIdSet, onRequestCreate, onRequestMove, onSelectTask, viewMode]);

  useEffect(() => {
    const groups = channels.map((channel) => ({
      id: channel,
      content: `<span class="gantt-group-title">${channel}</span>`
    }));

    groupsRef.current.clear();
    groupsRef.current.add(groups);

    const taskItems = tasks
      .filter((task) => groupIdSet.has(task.channel))
      .map((task) => ({
        id: toTaskItemId(task.id),
        group: task.channel,
        start: toTimelineStart(task.start_date),
        end: toTimelineEndExclusive(task.end_date),
        content: `<span class="task-pill-text">${task.script_no} ${task.task_name}</span>`,
        title: `${task.task_name}\n${task.channel} / ${task.assignee}`,
        className: task.id === selectedTaskId ? 'task-pill selected' : 'task-pill'
      }));

    const releaseItems = releaseDates
      .filter((release) => groupIdSet.has(release.channel))
      .flatMap((release) => {
        const color = channelColors[release.channel] ?? '#f0ad4e';
        const start = toTimelineStart(release.release_date);
        return [
          {
            id: `release-bg:${release.channel}:${release.script_no}:${release.release_date}`,
            group: release.channel,
            start,
            end: toTimelineEndExclusive(release.release_date),
            type: 'background',
            className: 'release-background',
            style: `background: ${color}33; border-left: 2px solid ${color};`
          },
          {
            id: `release-point:${release.channel}:${release.script_no}:${release.release_date}`,
            group: release.channel,
            start,
            type: 'point',
            content: `<span class="release-point-label" style="color:${color}">${release.script_no}</span>`,
            className: 'release-point',
            selectable: false
          }
        ];
      });

    itemsRef.current.clear();
    itemsRef.current.add([...taskItems, ...releaseItems]);

    if (timelineRef.current && selectedTaskId) {
      timelineRef.current.setSelection([toTaskItemId(selectedTaskId)]);
    }

    if (timelineRef.current && !fittedOnceRef.current) {
      if (viewMode === 'day') {
        const minStartDate = tasks
          .map((task) => task.start_date)
          .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))[0];
        const anchorDate = toTimelineStart(minStartDate ?? floorTimelineDateToJst(new Date()));
        timelineRef.current.setWindow(anchorDate, addDays(anchorDate, DEFAULT_DAY_WINDOW_DAYS), { animation: false });
      } else if (tasks.length > 0) {
        timelineRef.current.fit({
          animation: false
        });
      } else {
        const center = toTimelineStart(floorTimelineDateToJst(new Date()));
        timelineRef.current.setWindow(addDays(center, -DEFAULT_MONTH_WINDOW_DAYS / 2), addDays(center, DEFAULT_MONTH_WINDOW_DAYS / 2), {
          animation: false
        });
      }
      fittedOnceRef.current = true;
    }
  }, [channels, tasks, releaseDates, selectedTaskId, groupIdSet, channelColors, viewMode]);

  useEffect(() => {
    if (!timelineRef.current) {
      return;
    }

    timelineRef.current.setOptions({
      ...buildTimelineModeOptions(viewMode),
      editable: canEdit
        ? {
            updateTime: true,
            updateGroup: false,
            add: false,
            remove: false
          }
        : false
    });

    const range = timelineRef.current.getWindow();
    const centerMs = (range.start.getTime() + range.end.getTime()) / 2;

    if (viewMode === 'day') {
      const halfRangeMs = (DEFAULT_DAY_WINDOW_DAYS * DAY_MS) / 2;
      timelineRef.current.setWindow(new Date(centerMs - halfRangeMs), new Date(centerMs + halfRangeMs), {
        animation: false
      });
      return;
    }

    const halfRangeMs = (DEFAULT_MONTH_WINDOW_DAYS * DAY_MS) / 2;
    timelineRef.current.setWindow(new Date(centerMs - halfRangeMs), new Date(centerMs + halfRangeMs), {
      animation: false
    });
  }, [canEdit, viewMode]);

  return <div className={`gantt-shell ${viewMode === 'day' ? 'view-day' : 'view-month'}`} ref={containerRef} />;
};
