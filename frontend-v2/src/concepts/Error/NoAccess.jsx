import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button, Space, Typography, Result, ConfigProvider, Card } from "antd";
import { message } from "antd";
import { useResendVerificationEmailMutation } from "../../api/authApi";
import { useGetProfileQuery } from "../../api/userApi";
import { useAuth } from "../../context/AuthContext";
import {
  LogoutOutlined,
  MailOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
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
    skip: !auth?.token,
    refetchOnMountOrArgChange: true,
  });

  const [emailSent, setEmailSent] = useState(false);
  const [timer, setTimer] = useState(60);

  const user = profileData?.user;
  const isEmailVerified = user?.isEmailVerified === true;

  // Only show meaningful roles (skip "USERS" if it's just default)
  let roles = Array.isArray(user?.roles)
    ? user.roles.filter((r) => r !== "USERS" && r.trim())
    : [];

  const hasNoAccessRole = roles.length === 0;
  const needsVerification = !isEmailVerified;
  const showResendButton = needsVerification && !emailSent;

  useEffect(() => {
    if (profileError) {
      message.error("Couldn't load your profile. Please try again.");
    }
  }, [profileError]);

  useEffect(() => {
    if (!emailSent || timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((t) => t - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [emailSent, timer]);

  useEffect(() => {
    if (emailSent && timer === 0) {
      navigate("/login", { replace: true });
    }
  }, [emailSent, timer, navigate]);

  const handleResend = async () => {
    if (!user?.email) {
      message.error("No email address found.");
      return;
    }

    try {
      await resendVerificationEmail({ email: user.email }).unwrap();
      setEmailSent(true);
      setTimer(60);
      message.success(
        "Verification email sent! Check your inbox (and spam folder).",
      );
    } catch (err) {
      message.error(err?.data?.message || "Failed to send email. Try again.");
    }
  };

  const handleRetry = () =>
    refetchProfile().catch(() => message.error("Retry failed"));

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch {
      message.error("Logout failed");
    }
  };

  if (!user && !isFetchingProfile) {
    return (
      <Result
        status="500"
        title="Unable to load account information"
        subTitle="Something went wrong while fetching your profile."
        extra={
          <Button type="primary" onClick={handleRetry}>
            Retry
          </Button>
        }
      />
    );
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#f97316",
          colorPrimaryHover: "#fb923c",
          fontSize: 16,
        },
      }}
    >
      <div className="no-access-page">
        <Card className="no-access-card">
          <div className="no-access-icon-wrapper">
            {/* You can keep your CSS icon or use Ant Design icon + custom styling */}
            <div className="no-access-icon" />
            {/* Alternative: <MailOutlined style={{ fontSize: 80, color: '#f97316' }} /> */}
          </div>

          <Title level={2} style={{ marginBottom: 8 }}>
            {needsVerification ? "Verify Your Email" : "Account Under Review"}
          </Title>

          <Paragraph
            type="secondary"
            style={{ fontSize: 16, marginBottom: 32 }}
          >
            {needsVerification
              ? "We sent a verification link to your email. Please confirm your address to activate your account."
              : "Your account has been created successfully, but requires administrator approval before you can access the portal."}
          </Paragraph>

          {needsVerification && (
            <div style={{ marginBottom: 24 }}>
              <Text strong>Email status: </Text>
              <Text type="danger">Not verified</Text>
            </div>
          )}

          {hasNoAccessRole && !needsVerification && (
            <Paragraph type="secondary" style={{ marginBottom: 32 }}>
              Please contact your organization administrator to get the
              appropriate role assigned.
            </Paragraph>
          )}

          {emailSent && (
            <Paragraph
              type="success"
              strong
              style={{ fontSize: 16, margin: "24px 0" }}
            >
              Email sent successfully! Redirecting to login in {timer}{" "}
              seconds...
            </Paragraph>
          )}

          <Space
            direction="vertical"
            size="middle"
            style={{ width: "100%" }}
            align="center"
          >
            {showResendButton && (
              <Button
                type="primary"
                size="large"
                icon={<MailOutlined />}
                onClick={handleResend}
                loading={isResending}
                style={{ minWidth: 240 }}
              >
                Resend Verification Email
              </Button>
            )}

            <Space size="middle" wrap>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRetry}
                loading={isFetchingProfile}
              >
                Refresh Status
              </Button>

              <Button danger icon={<LogoutOutlined />} onClick={handleLogout}>
                Log out
              </Button>
            </Space>

            <Link to="/login" className="return-link">
              Return to login page
            </Link>
          </Space>
        </Card>
      </div>
    </ConfigProvider>
  );
};

export default NoAccess;
