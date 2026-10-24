import Loader from '../../components/Common/Loader';
import { Alert } from 'antd';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useGetProfileQuery } from '../../api/userApi';
import ZohoConnector from '../Zoho/ZohoConnector';

// Compatibility for saved CRM settings links and in-flight old callbacks.
export default function CrmSettings({ embedded = false }) {
  const { data: profile, isLoading, error } = useGetProfileQuery(undefined, { skip: embedded });
  const [params] = useSearchParams();
  if (embedded) return <ZohoConnector />;
  if (isLoading) return <Loader />;
  if (error || !profile?.user?.userId)
    return <Alert type="error" message="Could not load Connectors" />;
  return (
    <Navigate
      replace
      to={`/u/${profile.user.userId}/connectors${params.size ? `?${params}` : ''}`}
    />
  );
}
