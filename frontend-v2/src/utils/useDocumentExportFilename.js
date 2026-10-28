import { useGetSettingsQuery } from '../api/settingsApi';
import { documentExportFilename } from './documentExportFilename';
export default function useDocumentExportFilename() {
  const { data } = useGetSettingsQuery();
  return (options) => documentExportFilename({ ...options, formats: data?.data?.documentExports });
}
