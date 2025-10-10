import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { FaChartBar, FaBox } from "react-icons/fa6";
import {
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import Alert from "./Alert";
import "./pagewrapper.css";
import {
  useClockInMutation,
  useClockOutMutation,
  useGetAttendanceQuery,
} from "../../api/attendanceApi";
import { useGetProfileQuery } from "../../api/userApi";
import { useGetAllUsersQuery } from "../../api/userApi";

import DataTablePagination from "../Common/DataTablePagination";

const PageWrapper = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const [lowStockListModal, setLowStockListModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const startDate = today.toISOString().split("T")[0];
  const endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const {
    data: profile,
    isLoading: loadingProfile,
    error: profileError,
  } = useGetProfileQuery();

  const {
    data: usersData,
    isLoading: isUsersLoading,
    error: usersError,
    refetch: refetchUsers,
  } = useGetAllUsersQuery();

  const [clockIn, { isLoading: isClockInLoading }] = useClockInMutation();
  const [clockOut, { isLoading: isClockOutLoading }] = useClockOutMutation();

  const userId = profile?.user?.userId;
  const username = useMemo(() => {
    if (profile?.user?.name) {
      return profile.user.name
        .split(" ")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ");
    }
    return "Admin";
  }, [profile]);

  const users = usersData?.users || [];

  const {
    data: attendance,
    isLoading: loadingAttendance,
    error: attendanceError,
  } = useGetAttendanceQuery(
    { userId, startDate, endDate },
    { skip: !userId || loadingProfile || !!profileError }
  );

  const hasClockedIn = attendance?.length > 0 && !!attendance[0]?.clockIn;
  const hasClockedOut = hasClockedIn && !!attendance[0]?.clockOut;

  const handleClockIn = async () => {
    if (!userId) return toast.error("User ID is not available.");
    try {
      await clockIn({ userId }).unwrap();
    } catch (error) {
      toast.error("Failed to clock in.");
    }
  };

  const handleClockOut = async () => {
    if (!userId) return toast.error("User ID is not available.");
    try {
      await clockOut({ userId }).unwrap();
    } catch (error) {
      toast.error("Failed to clock out.");
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  useEffect(() => {
    if (profileError) {
      const message =
        profileError.status === 403 &&
        profileError.data?.error.includes("roleId")
          ? "Missing role information. Please contact support."
          : profileError.status === 401 || profileError.status === 403
          ? "Session expired. Please log in again."
          : "Failed to load profile.";
      toast.error(message, { id: "profileError" });
    }
  }, [profileError]);

  if (loadingProfile || isUsersLoading) {
    return (
      <div className="text-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (profileError || usersError) {
    return (
      <div className="alert alert-danger m-3" role="alert">
        <h5>Error loading data:</h5>
        {profileError && (
          <p>Profile: {profileError.data?.message || "Unknown error"}</p>
        )}

        {usersError && (
          <p>Users: {usersError.data?.message || "Unknown error"}</p>
        )}

        <button
          className="btn btn-primary mt-2"
          onClick={() => {
            if (usersError) refetchUsers();
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="page-wrapper">
        <Alert
          type="warning"
          message="User profile not found. Please log in again."
        />
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="dashboard">
          <div className="dashboard-header">
            <div>
              <h1>{username}</h1>
            </div>
          </div>

          {!hasClockedIn && !loadingAttendance && userId && (
            <Alert
              type="warning"
              message="Please clock in to start your workday!"
            />
          )}
          {attendanceError && (
            <Alert type="danger" message="Failed to load attendance data." />
          )}
        </div>
      </div>
    </div>
  );
};

export default PageWrapper;
