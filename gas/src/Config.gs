const APP_TZ = 'Asia/Tokyo';

const SHEET_NAMES = {
  TASKS: 'tasks',
  RELEASE_DATES: 'release_dates',
  MASTER_CHANNELS: 'master_channels',
  MASTER_TASK_TYPES: 'master_task_types',
  MASTER_STATUSES: 'master_statuses',
  USERS: 'users',
  AUDIT_LOG: 'audit_log'
};

const TASK_HEADERS = [
  'id',
  'version',
  'status',
  'channel',
  'assignee',
  'script_no',
  'task_type',
  'task_name',
  'start_date',
  'end_date',
  'deleted_at',
  'created_at',
  'created_by',
  'updated_at',
  'updated_by'
];

const RELEASE_DATE_HEADERS = ['channel', 'script_no', 'release_date', 'updated_at', 'updated_by'];

const MASTER_CHANNEL_HEADERS = ['channel', 'is_active', 'sort_order'];
const MASTER_TASK_TYPE_HEADERS = ['task_type', 'is_active', 'sort_order'];
const MASTER_STATUS_HEADERS = ['status', 'is_active', 'sort_order', 'color'];

const USER_HEADERS = ['email', 'role', 'is_active'];
const AUDIT_HEADERS = ['log_id', 'entity', 'entity_id', 'action', 'before_json', 'after_json', 'acted_by', 'acted_at'];

const TASK_REQUIRED_FIELDS = [
  'status',
  'channel',
  'assignee',
  'script_no',
  'task_type',
  'task_name',
  'start_date',
  'end_date'
];
