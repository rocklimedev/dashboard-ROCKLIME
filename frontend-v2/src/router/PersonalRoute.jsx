import { Alert, Button, Result, Spin } from "antd";
import { Link, Navigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useGetProfileQuery } from "../api/userApi";

export default function PersonalRoute({ children }) {
  const { id } = useParams();
  const { auth, authChecked } = useAuth();
  const { data, isLoading, error } = useGetProfileQuery(undefined, { skip: !auth?.token });
  if (!authChecked || isLoading) return <div className="page-wrapper"><div className="content"><Spin size="large" /></div></div>;
  if (!auth?.token) return <Navigate to="/login" replace />;
  if (error || !data?.user?.userId) return <div className="page-wrapper"><div className="content"><Alert type="error" showIcon message="Unable to load your account. Please try again." /></div></div>;
  if (id !== data.user.userId) return (
    <div className="page-wrapper"><div className="content"><Result status="403" title="This is a personal account section" subTitle="You can only access your own profile and account settings." extra={<Link to={`/u/${data.user.userId}/settings`}><Button type="primary">My account settings</Button></Link>} /></div></div>
  );
  return children;
}
