import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { toast } from "react-toastify";
import { API_URL } from "../data/config";
export const attendanceApi = createApi({
  reducerPath: "attendanceApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/attendance`,
  }),
  tagTypes: ["Attendance"], // For cache invalidation
  endpoints: (builder) => ({
    // Clock In
    clockIn: builder.mutation({
      query: ({ userId }) => ({
        url: "/clock-in",
        method: "POST",
        body: { userId },
      }),
      transformResponse: (response) => {
        if (!response.success) {
          throw new Error(response.message || "Failed to clock in");
        }
        toast.success(response.message);
        return response.data;
      },
      transformErrorResponse: (error) => {
        const message = error.data?.message || "Failed to clock in";
        toast.error(message);
        return { message };
      },
      invalidatesTags: ["Attendance"], // Invalidate cache to refresh attendance data
    }),

    // Clock Out
    clockOut: builder.mutation({
      query: ({ userId }) => ({
        url: "/clock-out",
        method: "POST",
        body: { userId },
      }),
      transformResponse: (response) => {
        if (!response.success) {
          throw new Error(response.message || "Failed to clock out");
        }
        toast.success(response.message);
        return response.data;
      },
      transformErrorResponse: (error) => {
        const message = error.data?.message || "Failed to clock out";
        toast.error(message);
        return { message };
      },
      invalidatesTags: ["Attendance"], // Invalidate cache to refresh attendance data
    }),

    // Get Attendance for a Specific User
    getAttendance: builder.query({
      query: ({ userId, startDate, endDate }) => ({
        url: "/",
        params: { userId, startDate, endDate },
      }),
      transformResponse: (response) => {
        if (!response.success) {
          throw new Error(response.message || "Failed to fetch attendance");
        }
        return response.data;
      },
      transformErrorResponse: (error) => {
        const message = error.data?.message || "Failed to fetch attendance";
        toast.error(message);
        return { message };
      },
      providesTags: ["Attendance"], // Cache attendance data
    }),

    // Get All Attendance Records
    getAllAttendance: builder.query({
      query: ({ page = 1, limit = 10, startDate, endDate, status }) => ({
        url: "/all",
        params: { page, limit, startDate, endDate, status },
      }),
      transformResponse: (response) => {
        if (!response.success) {
          throw new Error(response.message || "Failed to fetch all attendance");
        }
        return {
          attendances: response.data,
          meta: response.meta,
        };
      },
      transformErrorResponse: (error) => {
        const message = error.data?.message || "Failed to fetch all attendance";
        toast.error(message);
        return { message };
      },
      providesTags: ["Attendance"], // Cache attendance data
    }),
  }),
});

// Export hooks
export const {
  useClockInMutation,
  useClockOutMutation,
  useGetAttendanceQuery,
  useGetAllAttendanceQuery,
} = attendanceApi;
