declare module 'vis-timeline/standalone' {
  export class Timeline {
    constructor(
      container: HTMLElement,
      items: unknown,
      groups: unknown,
      options?: Record<string, unknown>
    );

    on(event: string, callback: (props: Record<string, unknown>) => void): void;
    setItems(items: unknown): void;
    setGroups(groups: unknown): void;
    setOptions(options: Record<string, unknown>): void;
    setSelection(ids: string[]): void;
    getWindow(): { start: Date; end: Date };
    setWindow(start: Date, end: Date, options?: Record<string, unknown>): void;
    fit(options?: Record<string, unknown>): void;
    destroy(): void;
  }
}
