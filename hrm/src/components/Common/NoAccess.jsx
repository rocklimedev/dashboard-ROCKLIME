import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button, Space, Typography, Result, ConfigProvider } from "antd";
import { message } from "antd";
import { useResendVerificationEmailMutation } from "../../api/authApi";
import { useGetProfileQuery } from "../../api/userApi";
import { useAuth } from "../../context/AuthContext";
import { LogoutOutlined } from "@ant-design/icons";
import "./NoAccess.css";

const { Title, Paragraph, Text } = Typography;

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
      message.error("Failed to fetch user profile.");
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
      message.error("Failed to retry. Please try again.");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      message.error("Logout failed. Please try again.");
    }
  };

  const handleResendVerification = async () => {
    if (!user?.email) {
      message.error("No email found for your account.");
      return;
    }
    try {
      await resendVerificationEmail({ email: user.email }).unwrap();
      setEmailSent(true);
      setTimer(60);
      message.success("Verification email sent! Please check your inbox.");
    } catch (error) {
      const errorMessage =
        error?.data?.message || "Failed to resend verification email.";
      message.error(errorMessage);
    }
  };

  // Removed loading state UI — assume global loader in App.jsx

  if (!user) {
    return (
      <div className="main-wrapper">
        <div className="content">
          <Result
            status="500"
            title="Unable to Load User Data"
            extra={
              <Button type="primary" onClick={handleRetry}>
                Retry
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#f97316", // orange-500
          fontSize: 16,
        },
      }}
    >
      <div className="main-wrapper">
        <div className="content">
          <div
            style={{
              maxWidth: 600,
              margin: "0 auto",
              padding: "40px 20px",
              textAlign: "center",
            }}
          >
            <div className="no-access-icon" style={{ marginBottom: 24 }} />
            <Title level={2}>Access Denied</Title>

            <Paragraph type="secondary">
              You are successfully registered but currently don’t have access to
              the portal.
            </Paragraph>

            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              <Text strong>Email Verification:</Text>
              <Text type={isEmailVerified ? "success" : "danger"}>
                {isEmailVerified ? "Verified" : "Not Verified"}
              </Text>
            </Space>

            <Space
              direction="vertical"
              size="small"
              style={{ marginTop: 16, width: "100%" }}
            >
              <Text strong>Roles:</Text>
              <Text type="secondary">
                {roles.length > 0 ? roles.join(", ") : "None"}
              </Text>
            </Space>

            {!isEmailVerified && (
              <Paragraph type="warning" style={{ marginTop: 16 }}>
                Your email address is not verified. Please check your inbox or
                click the button below to resend the verification email.
              </Paragraph>
            )}

            {accessRoles.length === 0 && (
              <Paragraph type="secondary" style={{ marginTop: 16 }}>
                Please contact an administrator to assign you a role.
              </Paragraph>
            )}

            {emailSent && (
              <Paragraph type="success" style={{ marginTop: 16 }}>
                Verification email sent. Redirecting to login in{" "}
                <strong>{timer}</strong> seconds.
              </Paragraph>
            )}

            <Space
              direction="vertical"
              size="middle"
              style={{ marginTop: 32, width: "100%" }}
            >
              <Space size="middle">
                <Button
                  type="primary"
                  onClick={handleRetry}
                  loading={isFetchingProfile}
                >
                  Retry
                </Button>
                <Button danger icon={<LogoutOutlined />} onClick={handleLogout}>
                  Logout
                </Button>
              </Space>

              {needsVerification && !emailSent && (
                <Button
                  type="default"
                  style={{
                    backgroundColor: "#faad14",
                    borderColor: "#faad14",
                    color: "white",
                  }}
                  onClick={handleResendVerification}
                  loading={isResending}
                  disabled={isFetchingProfile}
                >
                  {isResending ? "Resending..." : "Resend Verification Email"}
                </Button>
              )}

              <Link
                to="/login"
                style={{
                  color: "#f97316",
                  fontSize: 16,
                  fontWeight: 500,
                  textDecoration: "underline",
                }}
              >
                Return to Login
              </Link>
            </Space>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default NoAccess;
