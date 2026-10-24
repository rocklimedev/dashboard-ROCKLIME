import { useLocation } from 'react-router-dom';
import ErrorBoundary from '../components/Common/ErrorBoundary';

/** Navigation clears failures without remounting healthy layouts or discarding their state. */
export default function RouteErrorBoundary({ children, area, hasSidebar = true }) {
  const location = useLocation();
  return (
    <ErrorBoundary resetKey={location.key} area={area} variant={hasSidebar ? 'page' : 'screen'}>
      {children}
    </ErrorBoundary>
  );
}
