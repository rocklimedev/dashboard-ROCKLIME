import { lazy } from 'react';
// src/routes/errorRoutes.js
import { FaExclamationCircle } from 'react-icons/fa';
const NoAccess = lazy(() => import('../../concepts/Error/NoAccess'));
const Error404 = lazy(() => import('../../concepts/Error/Error404'));
import AccessDenied from '../../concepts/Error/AccessDenied';
export const errorRoutes = [
  { path: '/403', name: 'Access denied', isSidebarActive: false, element: <AccessDenied /> },
  {
    path: '/no-access',
    name: 'No Access',
    icon: <FaExclamationCircle />,
    isSidebarActive: false,
    element: <NoAccess />,
  },
  {
    path: '/404',
    name: 'Error 404',
    icon: <FaExclamationCircle />,
    element: <Error404 />,
  },
];
