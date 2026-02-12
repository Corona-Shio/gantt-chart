# RPC API (doPost)

Request:
```json
{
  "action": "tasks.list",
  "payload": {},
  "requestId": "optional"
}
```

Response:
```json
{
  "ok": true,
  "data": {}
}
```

Error:
```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION",
    "message": "...",
    "fields": ["start_date"]
  }
}
```

## Actions
- `bootstrap.get`
- `tasks.list`
- `tasks.create`
- `tasks.update`
- `tasks.delete`
- `releaseDates.list`
- `releaseDates.upsert`
- `import.initialFromSheet`

## Roles
- viewer: read only
- editor: task/release update
- admin: editor + import + user/master運用
