export type UserRole = 'admin' | 'editor' | 'viewer';

export type ApiErrorCode =
  | 'VALIDATION'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'NOT_FOUND'
  | 'INTERNAL';

export interface Task {
  id: string;
  version: number;
  status: string;
  channel: string;
  assignee: string;
  script_no: string;
  task_type: string;
  task_name: string;
  start_date: string;
  end_date: string;
  deleted_at: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
}

export interface ReleaseDate {
  channel: string;
  script_no: string;
  release_date: string;
  updated_at: string;
  updated_by: string;
}

export interface MasterChannel {
  channel: string;
  is_active: boolean;
  sort_order: number;
}

export interface MasterTaskType {
  task_type: string;
  is_active: boolean;
  sort_order: number;
}

export interface MasterStatus {
  status: string;
  is_active: boolean;
  sort_order: number;
  color: string;
}

export interface MasterData {
  channels: MasterChannel[];
  taskTypes: MasterTaskType[];
  statuses: MasterStatus[];
}

export interface BootstrapData {
  role: UserRole;
  email: string;
  masters: MasterData;
}

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  fields?: string[];
}

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: ApiError;
}

export interface RpcRequest {
  action: string;
  payload: Record<string, unknown>;
  requestId: string;
}

export interface TaskFilters {
  channel?: string;
  status?: string;
  assignee?: string;
  script_no?: string;
  date_from?: string;
  date_to?: string;
}

export type TaskDraft = Omit<
  Task,
  'id' | 'version' | 'deleted_at' | 'created_at' | 'created_by' | 'updated_at' | 'updated_by'
>;
