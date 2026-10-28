import { useMemo } from 'react';
import { useGetSettingsQuery } from '../api/settingsApi';
import useCan, { useRoles } from '../utils/useCan';
import { visibleApps } from './registry';
export default function useApps() {
  const can = useCan();
  const roles = useRoles();
  const { data } = useGetSettingsQuery(undefined, { pollingInterval: 60000, refetchOnFocus: true });
  return useMemo(() => visibleApps(can, roles, data?.data?.apps), [can, roles, data]);
}
