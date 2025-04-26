import React from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Button } from "react-bootstrap";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useLogoutMutation } from "../../api/authApi";
import { useGetProfileQuery } from "../../api/userApi";
import { BiLogOut } from "react-icons/bi";
import "./NoAccess.css";
const NoAccess = () => {
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  const navigate = useNavigate();
  const { data: profileData, refetch: refetchProfile } = useGetProfileQuery();

  const handleRetry = async () => {
    try {
      // Refetch the user profile to check for updated role
      const updatedProfile = await refetchProfile().unwrap();
      const roleId = updatedProfile?.user?.roleId;

      if (roleId === "USERS") {
        toast.error("Access still denied. Please contact an administrator.");
      } else {
        toast.success("Access granted! Redirecting to homepage...");
        navigate("/");
      }
    } catch (error) {
      toast.error("Failed to verify access. Please try again.");
      console.error("Retry failed", error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      localStorage.removeItem("token");
      toast.success("Logged out successfully!");
      navigate("/login");
    } catch (error) {
      toast.error("Logout failed. Please try again.");
      console.error("Logout failed", error);
    }
  };

  return (
    <div className="main-wrapper">
      <div className="content">
        <Container className="text-center py-5">
          <Row className="justify-content-center">
            <Col md={6}>
              <div className="no-access-icon" />
              <h2 className="mt-4">Access Denied</h2>
              <p className="text-muted">
                You are successfully registered but currently don’t have access
                to the portal.
              </p>
              <p className="text-muted">
                Please contact an administrator to assign you a role.
              </p>
              <div className="d-flex justify-content-center gap-3 mt-4">
                <Button
                  variant="primary"
                  onClick={handleRetry}
                  disabled={isLoggingOut}
                >
                  Retry
                </Button>
                <Button
                  variant="outline-danger"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  <BiLogOut /> {isLoggingOut ? "Logging out..." : "Logout"}
                </Button>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
};

export default NoAccess;
