import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const teamApi = createApi({
  reducerPath: "teamApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:4000/api/teams" }), // Adjust base URL
  tagTypes: ["Teams", "Members"],
  endpoints: (builder) => ({
    // Create Team
    createTeam: builder.mutation({
      query: (teamData) => ({
        url: "/create",
        method: "POST",
        body: teamData,
      }),
      invalidatesTags: ["Teams"],
    }),

    // Get All Teams
    getAllTeams: builder.query({
      query: () => "/all",
      providesTags: ["Teams"],
    }),

    // Update Team
    updateTeam: builder.mutation({
      query: ({ teamId, teamData }) => ({
        url: `/${teamId}/update`,
        method: "PUT",
        body: teamData,
      }),
      invalidatesTags: ["Teams"],
    }),

    // Delete Team
    deleteTeam: builder.mutation({
      query: (teamId) => ({
        url: `/${teamId}/delete`,
        method: "DELETE",
      }),
      invalidatesTags: ["Teams"],
    }),

    // Add Team Member
    addTeamMember: builder.mutation({
      query: (memberData) => ({
        url: "/add",
        method: "POST",
        body: memberData,
      }),
      invalidatesTags: ["Members"],
    }),

    // Get Team Members
    getTeamMembers: builder.query({
      query: (teamId) => `/${teamId}/members`,
      providesTags: ["Members"],
    }),

    // Update Team Member
    updateTeamMember: builder.mutation({
      query: ({ memberId, memberData }) => ({
        url: `/${memberId}/update`,
        method: "PUT",
        body: memberData,
      }),
      invalidatesTags: ["Members"],
    }),

    // Remove Team Member
    removeTeamMember: builder.mutation({
      query: (memberId) => ({
        url: `/${memberId}/remove`,
        method: "DELETE",
      }),
      invalidatesTags: ["Members"],
    }),
  }),
});

export const {
  useCreateTeamMutation,
  useGetAllTeamsQuery,
  useUpdateTeamMutation,
  useDeleteTeamMutation,
  useAddTeamMemberMutation,
  useGetTeamMembersQuery,
  useUpdateTeamMemberMutation,
  useRemoveTeamMemberMutation,
} = teamApi;
