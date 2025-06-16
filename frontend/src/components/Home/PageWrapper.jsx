import React, { useEffect } from "react";
import { toast } from "sonner";
import Alert from "./Alert";
import Recents from "./Recents";
import Stats from "./Stats";
import Stats2 from "./Stats2";
import {
  useClockInMutation,
  useClockOutMutation,
  useGetAttendanceQuery,
} from "../../api/attendanceApi";
import { useGetProfileQuery } from "../../api/userApi";
import { useGetAllOrdersQuery } from "../../api/orderApi";

const PageWrapper = () => {
  // Move all Hooks to the top level
  const {
    data: profile,
    isLoading: loadingProfile,
    error: profileError,
  } = useGetProfileQuery();
  const { data, isLoading: loadingOrders } = useGetAllOrdersQuery();
  const [clockIn, { isLoading: isClockInLoading }] = useClockInMutation();
  const [clockOut, { isLoading: isClockOutLoading }] = useClockOutMutation();

  // Define userId and username early
  const userId = profile?.user?.userId;
  const username = profile?.user?.name
    ? profile.user.name.charAt(0).toUpperCase() + profile.user.name.slice(1)
    : "Admin";

  // Define date variables early
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = today.toISOString().split("T")[0];
  const endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  // Attendance query
  const {
    data: attendance,
    isLoading: loadingAttendance,
    error: attendanceError,
  } = useGetAttendanceQuery(
    { userId, startDate, endDate },
    { skip: !userId || loadingProfile || !!profileError }
  );

  // Define derived state
  const orders = data?.orders || [];
  const hasClockedIn = attendance?.length > 0 && !!attendance[0]?.clockIn;
  const hasClockedOut = hasClockedIn && !!attendance[0]?.clockOut;

  // Profile error toast
  useEffect(() => {
    if (profileError) {
      const message =
        profileError.status === 403 &&
        profileError.data?.error.includes("roleId")
          ? "Missing role information. Please contact support."
          : profileError.status === 401 || profileError.status === 403
          ? "Session expired. Please log in again."
          : "Failed to load profile.";
      toast.error(message, { toastId: "profileError" });
    }
  }, [profileError]);

  // Debug logging
  useEffect(() => {
    console.log("Debug Info:", {
      profile,
      profileError,
      userId,
      loadingProfile,
      loadingAttendance,
      attendance,
      hasClockedIn,
      hasClockedOut,
      attendanceError,
    });
  }, [
    profile,
    profileError,
    userId,
    loadingProfile,
    loadingAttendance,
    attendance,
    hasClockedIn,
    hasClockedOut,
    attendanceError,
  ]);

  // Clock-in reminder toast
  useEffect(() => {
    if (
      !loadingAttendance &&
      !hasClockedIn &&
      !attendanceError &&
      userId &&
      !profileError
    ) {
      toast.warning("You haven't clocked in today!", {
        toastId: "clockInReminder",
      });
    }
  }, [loadingAttendance, hasClockedIn, attendanceError, userId, profileError]);

  // Handle early returns
  if (profileError) {
    return (
      <div className="page-wrapper">
        <Alert
          type="danger"
          message={
            profileError.status === 403 &&
            profileError.data?.error.includes("roleId")
              ? "Missing role information. Please contact support."
              : profileError.status === 401 || profileError.status === 403
              ? "Session expired. Please log in again."
              : "Failed to load user profile."
          }
        />
      </div>
    );
  }

  if (!loadingProfile && !profile) {
    return (
      <div className="page-wrapper">
        <Alert
          type="warning"
          message="User profile not found. Please log in again."
        />
      </div>
    );
  }

  // Clock-in/out handlers
  const handleClockIn = async () => {
    if (!userId) {
      toast.error("User ID is not available.");
      return;
    }
    try {
      await clockIn({ userId }).unwrap();
    } catch (error) {
      // Error handled by transformErrorResponse
    }
  };

  const handleClockOut = async () => {
    if (!userId) {
      toast.error("User ID is not available.");
      return;
    }
    try {
      await clockOut({ userId }).unwrap();
    } catch (error) {
      // Error handled by transformErrorResponse
    }
  };

  // Filter today's orders
  const todaysOrders = orders.filter((order) => {
    const rawDate = order.createdAt;
    if (!rawDate || isNaN(new Date(rawDate))) return false;
    const orderDate = new Date(rawDate).toISOString().split("T")[0];
    return orderDate === startDate;
  });

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-2">
          <div className="attendance-content">
            <h3>
              Good Morning, <span>{loadingProfile ? "..." : username}</span>
            </h3>
            <p className="fw-medium mt-2">
              You have{" "}
              <span className="text-primary fw-bold">
                {loadingOrders ? "..." : todaysOrders.length}
              </span>{" "}
              Order{!loadingOrders && todaysOrders.length !== 1 && "s"} Today
            </p>
          </div>
          <div className="mt-2">
            {loadingProfile || loadingAttendance ? (
              <span>Loading...</span>
            ) : !userId ? (
              <span>User profile not loaded</span>
            ) : !hasClockedIn ? (
              <button
                className="btn btn-primary me-2"
                onClick={handleClockIn}
                disabled={isClockInLoading || isClockOutLoading}
              >
                {isClockInLoading ? "Clocking In..." : "Clock In"}
              </button>
            ) : !hasClockedOut ? (
              <button
                className="btn btn-secondary me-2"
                onClick={handleClockOut}
                disabled={isClockInLoading || isClockOutLoading}
              >
                {isClockOutLoading ? "Clocking Out..." : "Clock Out"}
              </button>
            ) : (
              <span>Clocked out for today</span>
            )}
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
        <Recents />
        <Stats />
        <Stats2 />
      </div>
    </div>
  );
};

export default PageWrapper;
