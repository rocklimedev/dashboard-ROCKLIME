import { baseApi } from "./baseApi";

export const teamApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Create Team
    createTeam: builder.mutation({
      query: (teamData) => ({
        url: "/teams/create",
        method: "POST",
        body: teamData,
      }),
      invalidatesTags: ["Teams"],
    }),

    // Get All Teams
    getAllTeams: builder.query({
      query: () => "/teams/all",
      providesTags: ["Teams"],
    }),

    // Get Single Team
    getTeamById: builder.query({
      query: (teamId) => `/teams/${teamId}`,
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
        return {
          url: `/teams/update/${teamId}`, // Correct endpoint
          method: "PUT",
          body,
        };
      },
    }),

    // Delete Team
    deleteTeam: builder.mutation({
      query: (teamId) => ({
        url: `/teams/delete/${teamId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Teams"],
    }),

    // Add Team Member
    addTeamMember: builder.mutation({
      query: (memberData) => ({
        url: `/teams/members/add`,
        method: "POST",
        body: memberData,
      }),
      invalidatesTags: ["Members", "Teams"], // optional if adding member changes team view too
    }),

    // Get Team Members
    getTeamMembers: builder.query({
      query: (teamId) => `/teams/members/${teamId}`,
      providesTags: ["Members"],
    }),

    // Update Team Member
    updateTeamMember: builder.mutation({
      query: ({ memberId, memberData }) => ({
        url: `/teams/members/update/${memberId}`,
        method: "PUT",
        body: memberData,
      }),
      invalidatesTags: ["Members", "Teams"],
    }),

    // Remove Team Member
    removeTeamMember: builder.mutation({
      query: (memberId) => ({
        url: `/teams/members/remove/${memberId}`,
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
