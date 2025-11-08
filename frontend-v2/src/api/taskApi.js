import { baseApi } from "./baseApi";

// Define the task API
export const taskApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Create a task
    createTask: builder.mutation({
      query: (taskData) => ({
        url: "/tasks/",
        method: "POST",
        body: taskData,
      }),
      invalidatesTags: ["Tasks", "UserTasks", "CreatedTasks"],
    }),

    // Get all tasks with filters
    getTasks: builder.query({
      query: (params = {}) => {
        const {
          status,
          priority,
          assignedTo,
          assignedBy,
          assignedTeamId,
          resourceType,
          resourceId,
          tags,
          isOverdue,
          isArchived,
          search,
          page = 1,
          limit = 20,
          sortBy = "createdAt",
          sortOrder = "desc",
        } = params;
        return {
          url: "/tasks/",
          params: {
            status,
            priority,
            assignedTo,
            assignedBy,
            assignedTeamId,
            resourceType,
            resourceId,
            tags,
            isOverdue,
            isArchived,
            search,
            page,
            limit,
            sortBy,
            sortOrder,
          },
        };
      },
      providesTags: ["Tasks"],
    }),
    // Get task by ID
    getTaskById: builder.query({
      query: (id) => `/tasks/${id}`,
      providesTags: (result, error, id) => [{ type: "Task", id }],
    }),

    // Update task
    updateTask: builder.mutation({
      query: ({ id, ...updates }) => ({
        url: `/tasks/${id}`,
        method: "PUT",
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Task", id },
        "Tasks",
        "UserTasks",
        "CreatedTasks",
        "OverdueTasks",
      ],
    }),

    // Add or remove watcher
    manageWatcher: builder.mutation({
      query: ({ id, userId, action }) => ({
        url: `/tasks/${id}/watchers`,
        method: "PUT",
        body: { userId, action },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Task", id },
        "Tasks",
      ],
    }),

    // Add attachment
    addAttachment: builder.mutation({
      query: ({ id, file, userId }) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("userId", userId);
        return {
          url: `/tasks/${id}/attachments`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: (result, error, { id }) => [
        { type: "Task", id },
        "Tasks",
      ],
    }),

    // Get task statistics
    getTaskStats: builder.query({
      query: ({ userId, teamId, startDate, endDate }) => ({
        url: "/tasks/stats",
        params: { userId, teamId, startDate, endDate },
      }),
      providesTags: ["TaskStats"],
    }),

    // Get tasks by linked resource
    getTasksByResource: builder.query({
      query: ({ resourceType, resourceId }) =>
        `/tasks/resource/${resourceType}/${resourceId}`,
      providesTags: ["Tasks"],
    }),

    // Bulk update tasks
    bulkUpdateTasks: builder.mutation({
      query: ({ taskIds, updates }) => ({
        url: "/tasks/bulk-update",
        method: "PUT",
        body: { taskIds, updates },
      }),
      invalidatesTags: ["Tasks", "UserTasks", "CreatedTasks", "OverdueTasks"],
    }),

    // Get tasks assigned to a user
    getMyTasks: builder.query({
      query: ({ userId, status, priority, page, limit }) => ({
        url: `/tasks/user/${userId}`,
        params: { status, priority, page, limit },
      }),
      providesTags: ["UserTasks"],
    }),

    // Get tasks created by a user
    getCreatedTasks: builder.query({
      query: ({ userId, page, limit }) => ({
        url: `/tasks/created/${userId}`,
        params: { page, limit },
      }),
      providesTags: ["CreatedTasks"],
    }),

    // Get overdue tasks
    getOverdueTasks: builder.query({
      query: ({ userId, teamId }) => ({
        url: "/tasks/overdue",
        params: { userId, teamId },
      }),
      providesTags: ["OverdueTasks"],
    }),

    // Clone a task
    cloneTask: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/tasks/${id}/clone`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Tasks", "UserTasks", "CreatedTasks"],
    }),

    // Update time tracking
    updateTimeTracking: builder.mutation({
      query: ({ id, actualHours }) => ({
        url: `/tasks/${id}/time-tracking`,
        method: "PUT",
        body: { actualHours },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Task", id },
        "Tasks",
      ],
    }),

    // Delete a task
    deleteTask: builder.mutation({
      query: (id) => ({
        url: `/tasks/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Tasks", "UserTasks", "CreatedTasks", "OverdueTasks"],
    }),

    // Archive or unarchive a task
    archiveTask: builder.mutation({
      query: ({ id, archive, userId }) => ({
        url: `/tasks/${id}/archive`,
        method: "PUT",
        body: { archive, userId },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Task", id },
        "Tasks",
        "UserTasks",
        "CreatedTasks",
      ],
    }),

    // Update checklist item
    updateChecklistItem: builder.mutation({
      query: ({ id, checklistIndex, isCompleted, userId }) => ({
        url: `/tasks/${id}/checklist`,
        method: "PUT",
        body: { checklistIndex, isCompleted, userId },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Task", id },
        "Tasks",
      ],
    }),
  }),
});

// Export hooks for use in components
export const {
  useCreateTaskMutation,
  useGetTasksQuery,
  useGetTaskByIdQuery,
  useUpdateTaskMutation,
  useManageWatcherMutation,
  useAddAttachmentMutation,
  useGetTaskStatsQuery,
  useGetTasksByResourceQuery,
  useBulkUpdateTasksMutation,
  useGetMyTasksQuery,
  useGetCreatedTasksQuery,
  useGetOverdueTasksQuery,
  useCloneTaskMutation,
  useUpdateTimeTrackingMutation,
  useDeleteTaskMutation,
  useArchiveTaskMutation,
  useUpdateChecklistItemMutation,
} = taskApi;
