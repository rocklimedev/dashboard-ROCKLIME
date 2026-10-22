import { baseApi } from '../store/baseApi';

export const planningApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPlanningRecords: builder.query({
      async queryFn({ collection }, _api, _extra, fetch) {
        const path = collection === 'tasks' ? '/tasks' : '/calendar/events';
        const items = [];
        let page = 1;
        while (true) {
          const result = await fetch(`${path}?page=${page}&limit=200`);
          if (result.error) return { error: result.error };
          items.push(...result.data.items);
          if (items.length >= result.data.total || result.data.items.length === 0) break;
          page += 1;
        }
        return { data: items };
      },
      providesTags: (_result, _error, { collection, owner }) => [
        { type: 'Planning', id: `${owner}:${collection}` },
      ],
    }),
    savePlanningRecord: builder.mutation({
      query: ({ collection, id, values, version }) => ({
        url: `${collection === 'tasks' ? '/tasks' : '/calendar/events'}${id ? `/${id}` : ''}`,
        method: id ? 'PATCH' : 'POST',
        body: id ? { ...values, version } : values,
      }),
      invalidatesTags: (_result, _error, { collection, owner }) => [
        { type: 'Planning', id: `${owner}:${collection}` },
      ],
    }),
    deletePlanningRecord: builder.mutation({
      query: ({ collection, id, version }) => ({
        url: `${collection === 'tasks' ? '/tasks' : '/calendar/events'}/${id}`,
        method: 'DELETE',
        body: { version },
      }),
      invalidatesTags: (_result, _error, { collection, owner }) => [
        { type: 'Planning', id: `${owner}:${collection}` },
      ],
    }),
    getZohoProjectsPortals: builder.query({
      query: () => '/zoho/projects/portals',
      providesTags: ['Zoho'],
    }),
    getZohoProjects: builder.query({
      query: ({ portalId, page = 1 }) =>
        `/zoho/projects/portals/${encodeURIComponent(portalId)}/projects?page=${page}`,
      providesTags: ['Zoho'],
    }),
    getZohoProjectTasks: builder.query({
      query: ({ portalId, projectId, page = 1 }) =>
        `/zoho/projects/portals/${encodeURIComponent(portalId)}/projects/${encodeURIComponent(projectId)}/tasks?page=${page}`,
      providesTags: ['Zoho'],
    }),
    getZohoCalendars: builder.query({
      query: () => '/zoho/calendar/calendars',
      providesTags: ['Zoho'],
    }),
    getZohoCalendarEvents: builder.query({
      query: ({ calendarId, start, end }) =>
        `/zoho/calendar/calendars/${encodeURIComponent(calendarId)}/events?${new URLSearchParams({ start, end })}`,
      providesTags: ['Zoho'],
    }),
  }),
});
export const {
  useGetPlanningRecordsQuery,
  useSavePlanningRecordMutation,
  useDeletePlanningRecordMutation,
  useGetZohoProjectsPortalsQuery,
  useGetZohoProjectsQuery,
  useGetZohoProjectTasksQuery,
  useGetZohoCalendarsQuery,
  useGetZohoCalendarEventsQuery,
} = planningApi;
