import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Container, Row, Col, Button } from "react-bootstrap";
import { toast } from "sonner";
import { useResendVerificationEmailMutation } from "../../api/authApi";
import { useGetProfileQuery } from "../../api/userApi";
import { useAuth } from "../../context/AuthContext";
import { BiLogOut } from "react-icons/bi";
import "./NoAccess.css";

const NoAccess = () => {
  const { auth, logout } = useAuth();
  const [resendVerificationEmail, { isLoading: isResending }] =
    useResendVerificationEmailMutation();
  const navigate = useNavigate();
  const {
    data: profileData,
    refetch: refetchProfile,
    error: profileError,
    isFetching: isFetchingProfile,
  } = useGetProfileQuery(undefined, {
    refetchOnMountOrArgChange: true,
    skip: !auth?.token,
  });
  const [emailSent, setEmailSent] = useState(false);
  const [timer, setTimer] = useState(60);

  const user = profileData?.user;
  const isEmailVerified = user?.isEmailVerified === true;
  let roles = user?.roles || [];
  if (typeof roles === "string") {
    try {
      roles = JSON.parse(roles);
    } catch (e) {
      console.error("Failed to parse roles:", e);
      roles = [];
    }
  }
  const accessRoles = Array.isArray(roles)
    ? roles.filter((r) => r !== "USERS")
    : [];
  const needsVerification = !isEmailVerified && accessRoles.length === 0;

  // Handle profile fetch errors
  useEffect(() => {
    if (profileError) {
      toast.error("Failed to fetch user profile.");
    }
  }, [profileError]);

  // Auto-redirect after email sent
  useEffect(() => {
    if (emailSent && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (emailSent && timer === 0) {
      navigate("/login", { replace: true });
    }
  }, [emailSent, timer, navigate]);

  const handleRetry = async () => {
    try {
      await refetchProfile();
    } catch (error) {
      toast.error("Failed to retry. Please try again.");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error("Logout failed. Please try again.");
    }
  };

  const handleResendVerification = async () => {
    if (!user?.email) {
      toast.error("No email found for your account.");
      return;
    }
    try {
      await resendVerificationEmail({ email: user.email }).unwrap();
      setEmailSent(true);
      setTimer(60);
      toast.success("Verification email sent! Please check your inbox.");
    } catch (error) {
      const errorMessage =
        error?.data?.message || "Failed to resend verification email.";
      toast.error(errorMessage);
    }
  };

  if (isFetchingProfile) {
    return (
      <Container className="text-center py-5">
        <p>Loading user data...</p>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container className="text-center py-5">
        <p>
          Unable to load user data. <Button onClick={handleRetry}>Retry</Button>
        </p>
      </Container>
    );
  }

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
                Email Verification:{" "}
                {isEmailVerified ? "Verified" : "Not Verified"}
              </p>
              <p className="text-muted">
                Roles: {roles.length > 0 ? roles.join(", ") : "None"}
              </p>
              {!isEmailVerified && (
                <p className="text-warning">
                  Your email address is not verified. Please check your inbox or
                  click the button below to resend the verification email.
                </p>
              )}
              {accessRoles.length === 0 && (
                <p className="text-muted">
                  Please contact an administrator to assign you a role.
                </p>
              )}
              {emailSent && (
                <p className="text-success">
                  Verification email sent. Redirecting to login in {timer}{" "}
                  seconds.
                </p>
              )}
              <div className="d-flex flex-column align-items-center gap-3 mt-4">
                <div className="d-flex gap-3">
                  <Button
                    variant="primary"
                    onClick={handleRetry}
                    disabled={isFetchingProfile}
                  >
                    Retry
                  </Button>
                  <Button variant="outline-danger" onClick={handleLogout}>
                    <BiLogOut /> Logout
                  </Button>
                </div>
                {needsVerification && !emailSent && (
                  <Button
                    variant="warning"
                    onClick={handleResendVerification}
                    disabled={isResending || isFetchingProfile}
                  >
                    {isResending ? "Resending..." : "Resend Verification Email"}
                  </Button>
                )}
                <Link to="/login" className="text-orange fs-16 fw-medium">
                  Return to Login
                </Link>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
};

export default NoAccess;
