# AGENDA

AGENDA is one launcher app with a Tasks board at `/agenda/tasks` and Calendar at `/agenda/calendar`. `/agenda` opens the board; old `/tasks` and `/calendar` URLs redirect to their corresponding Agenda view. Task and event domain modules and backend endpoints remain separate for Zoho integration.

Tasks render as three Kanban columns (To do, In progress, Done), preserving API status values (`Open`, `In progress`, `Completed`). Drag a card by its handle to another column or use its keyboard-accessible status menu. Moves use versioned API updates; failures leave the persisted status unchanged. Search and priority filters do not alter records.

Calendar provides month, week and day views, a date picker, task deadlines, event visibility filters and a selected-day schedule. Time slots create appointments at that time. Overlapping events receive separate lanes; multi-day events are clipped to each visible day and midnight endpoints remain exclusive. Dates and times display in the browser timezone. No new provider sync behavior is introduced by this redesign.

Tasks UI lives in `../tasks`, Calendar UI in `../calendar`. Both now use authenticated server APIs through `src/api/planningApi.js` and `usePlanning`; browser storage is no longer the active persistence adapter.

- `/api/tasks`: personal task records, project labels, status, priority and date-only deadlines.
- `/api/calendar/events`: personal timed events, UTC instants and IANA timezone names.
- Create, edit and delete await the server; failures leave the editor open. Optimistic versions prevent stale edits. Cache entries are partitioned by signed-in profile and invalidated after mutations.
- The calendar derives task deadlines from the same Tasks API; it does not duplicate them as events.

Deploy backend migration `20261022000100-planning.js` before using these screens. Existing browser-only records remain in their original localStorage keys; they are not automatically uploaded or deleted. `repository.js` and its test are retained as the legacy browser adapter, not imported by the live workspace.

`planningApi.js` also exports query hooks for Zoho portals, projects, project tasks, calendars and ranged events. Their responses retain the provider's native shape and metadata, so recurring/all-day events and provider-specific statuses are not silently flattened into ERP records. Enable Projects & Calendar access in Connectors and reconnect Zoho before calling these endpoints. Reading Zoho is available through the backend; automatic import, linking, outbound writes and bidirectional sync are future work.

See `backend/modules/planning/README.md` for route contracts, ownership, concurrency and integration rules.
