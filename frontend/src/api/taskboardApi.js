import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../data/config";

export const taskBoardApi = createApi({
  reducerPath: "taskBoardApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["TaskBoard", "Task"],
  endpoints: (builder) => ({
    // Get TaskBoards by resource type and ID
    getTaskBoards: builder.query({
      query: ({ resourceType, resourceId, page = 1, limit = 20 }) => ({
        url: `/taskboards/resource/${resourceType}/${resourceId}`,
        params: { page, limit },
      }),
      providesTags: ["TaskBoard"],
    }),
    // Get TaskBoard by ID with associated tasks
    getTaskBoardById: builder.query({
      query: (id) => `/taskboards/${id}`,
      providesTags: (result, error, id) => [{ type: "TaskBoard", id }],
    }),
    // Get tasks for a specific TaskBoard
    getTasksByTaskBoard: builder.query({
      query: ({
        taskBoardId,
        page = 1,
        limit = 20,
        status,
        priority,
        search,
      }) => ({
        url: `/tasks`,
        params: {
          taskBoard: taskBoardId,
          page,
          limit,
          status,
          priority,
          search,
        },
      }),
      providesTags: ["Task"],
    }),
    // Get TaskBoards by owner
    getTaskBoardsByOwner: builder.query({
      query: ({ ownerId, page = 1, limit = 20 }) => ({
        url: `/taskboards/owner/${ownerId}`,
        params: { page, limit },
      }),
      providesTags: ["TaskBoard"],
    }),
    // Get TaskBoards by creator
    getTaskBoardsByCreator: builder.query({
      query: ({ creatorId, page = 1, limit = 20 }) => ({
        url: `/taskboards/creator/${creatorId}`,
        params: { page, limit },
      }),
      providesTags: ["TaskBoard"],
    }),
    // Create TaskBoard
    createTaskBoard: builder.mutation({
      query: (taskBoardData) => ({
        url: "/taskboards",
        method: "POST",
        body: taskBoardData,
      }),
      invalidatesTags: ["TaskBoard"],
    }),
    // Update TaskBoard
    updateTaskBoard: builder.mutation({
      query: ({ id, ...updates }) => ({
        url: `/taskboards/${id}`,
        method: "PUT",
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "TaskBoard", id }],
    }),
    // Archive TaskBoard
    archiveTaskBoard: builder.mutation({
      query: ({ id, archive, userId }) => ({
        url: `/taskboards/${id}/archive`,
        method: "PUT",
        body: { archive, userId },
      }),
      invalidatesTags: ["TaskBoard"],
    }),
    // Delete TaskBoard
    deleteTaskBoard: builder.mutation({
      query: ({ id, deleteTasks = false, userId }) => ({
        url: `/taskboards/${id}`,
        method: "DELETE",
        body: { deleteTasks, userId },
      }),
      invalidatesTags: ["TaskBoard", "Task"],
    }),
    // Manage TaskBoard members (add/remove)
    manageTaskBoardMember: builder.mutation({
      query: ({ id, userId, action }) => ({
        url: `/taskboards/${id}/members`,
        method: "PUT",
        body: { userId, action },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "TaskBoard", id }],
    }),
    // Get TaskBoard statistics
    getTaskBoardStats: builder.query({
      query: (id) => `/taskboards/${id}/stats`,
      providesTags: (result, error, id) => [{ type: "TaskBoard", id }],
    }),
  }),
});

export const {
  useGetTaskBoardsQuery,
  useGetTaskBoardByIdQuery,
  useGetTasksByTaskBoardQuery,
  useGetTaskBoardsByOwnerQuery,
  useGetTaskBoardsByCreatorQuery,
  useCreateTaskBoardMutation,
  useUpdateTaskBoardMutation,
  useArchiveTaskBoardMutation,
  useDeleteTaskBoardMutation,
  useManageTaskBoardMemberMutation,
  useGetTaskBoardStatsQuery,
} = taskBoardApi;
