import React, { useEffect } from "react";
import { toast } from "sonner";
import Alert from "./Alert";
import Recents from "./Recents";
import Stats from "./Stats";
import Stats2 from "./Stats2";
import { useGetAllOrdersQuery } from "../../api/orderApi";
import { useGetProfileQuery } from "../../api/userApi";
import {
  useClockInMutation,
  useClockOutMutation,
  useGetAttendanceQuery,
} from "../../api/attendanceApi";

const PageWrapper = () => {
  const { data: profile, isLoading: loadingProfile } = useGetProfileQuery();
  const { data, isLoading: loadingOrders } = useGetAllOrdersQuery();
  const orders = data?.orders || [];

  const userId = profile?.user?.userId;
  // Capitalize the first letter of the name
  const username = profile?.user?.name
    ? profile.user.name.charAt(0).toUpperCase() + profile.user.name.slice(1)
    : "Admin";

  // Fetch today's attendance for the user
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = today.toISOString().split("T")[0];
  const endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const {
    data: attendance,
    isLoading: loadingAttendance,
    error: attendanceError,
  } = useGetAttendanceQuery({ userId, startDate, endDate }, { skip: !userId });

  const [clockIn, { isLoading: isClockInLoading }] = useClockInMutation();
  const [clockOut, { isLoading: isClockOutLoading }] = useClockOutMutation();

  // Check if user has clocked in and out today
  const hasClockedIn = attendance?.length > 0 && !!attendance[0]?.clockIn;
  const hasClockedOut = hasClockedIn && !!attendance[0]?.clockOut;

  // Debug logging
  useEffect(() => {
    console.log("Debug Info:", {
      userId,
      loadingProfile,
      loadingAttendance,
      attendance,
      hasClockedIn,
      hasClockedOut,
      attendanceError,
    });
  }, [
    userId,
    loadingProfile,
    loadingAttendance,
    attendance,
    hasClockedIn,
    hasClockedOut,
    attendanceError,
  ]);

  // Alert if user hasn't clocked in
  useEffect(() => {
    if (!loadingAttendance && !hasClockedIn && !attendanceError) {
      toast.warn("You haven't clocked in today!", {
        toastId: "clockInReminder",
      });
    }
  }, [loadingAttendance, hasClockedIn, attendanceError]);

  // Handle clock-in
  const handleClockIn = async () => {
    if (!userId) {
      toast.error("User ID is not available. Please try again.");
      return;
    }
    try {
      await clockIn({ userId }).unwrap();
    } catch (error) {
      // Error handled by transformErrorResponse in attendanceApi
    }
  };

  // Handle clock-out
  const handleClockOut = async () => {
    if (!userId) {
      toast.error("User ID is not available. Please try again.");
      return;
    }
    try {
      await clockOut({ userId }).unwrap();
    } catch (error) {
      // Error handled by transformErrorResponse in attendanceApi
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
              <span>Clocked out for today</span> // Optional: Show status
            )}
          </div>
        </div>

        {!hasClockedIn && !loadingAttendance && (
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
