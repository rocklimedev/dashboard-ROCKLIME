import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../data/config";

export const teamApi = createApi({
  reducerPath: "teamApi",
  baseQuery: fetchBaseQuery({ baseUrl: `${API_URL}/teams` }),
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

    // Get Single Team
    getTeamById: builder.query({
      query: (teamId) => `/${teamId}`,
      providesTags: ["Teams"],
    }),

    // Update Team
    updateTeam: builder.mutation({
      query: ({ teamId, teamName, adminId, adminName, members }) => {
        const body = {
          teamName,
          adminId,
          adminName,
          memberIds: members.map((m) => m.userId), // Transform members to memberIds
        };
        console.log("RTK Query sending team update:", { teamId, body }); // Debug
        return {
          url: `/update/${teamId}`, // Correct endpoint
          method: "PUT",
          body,
        };
      },
    }),

    // Delete Team
    deleteTeam: builder.mutation({
      query: (teamId) => ({
        url: `/delete/${teamId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Teams"],
    }),

    // Add Team Member
    addTeamMember: builder.mutation({
      query: (memberData) => ({
        url: `/members/add`,
        method: "POST",
        body: memberData,
      }),
      invalidatesTags: ["Members", "Teams"], // optional if adding member changes team view too
    }),

    // Get Team Members
    getTeamMembers: builder.query({
      query: (teamId) => `/members/${teamId}`,
      providesTags: ["Members"],
    }),

    // Update Team Member
    updateTeamMember: builder.mutation({
      query: ({ memberId, memberData }) => ({
        url: `/members/update/${memberId}`,
        method: "PUT",
        body: memberData,
      }),
      invalidatesTags: ["Members", "Teams"],
    }),

    // Remove Team Member
    removeTeamMember: builder.mutation({
      query: (memberId) => ({
        url: `/members/remove/${memberId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Members", "Teams"],
    }),
  }),
});

export const {
  useCreateTeamMutation,
  useGetAllTeamsQuery,
  useGetTeamByIdQuery,
  useUpdateTeamMutation,
  useDeleteTeamMutation,
  useAddTeamMemberMutation,
  useGetTeamMembersQuery,
  useUpdateTeamMemberMutation,
  useRemoveTeamMemberMutation,
} = teamApi;
