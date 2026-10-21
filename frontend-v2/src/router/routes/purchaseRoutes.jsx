import { lazy } from 'react';
// src/routes/purchaseRoutes.js
import { FaShoppingCart, FaFileAlt } from 'react-icons/fa';
const PurchaseManagement = lazy(() => import('../../concepts/PO/PurchaseManagement'));
const AddPurchaseOrder = lazy(() => import('../../concepts/PO/AddPurchaseOrder'));
const PODetails = lazy(() => import('../../concepts/PO/PODetails'));

export const purchaseRoutes = [
  {
    path: '/po/add',
    name: 'Add Purchase Order',
    icon: <FaFileAlt />,
    isSidebarActive: false,
    element: <AddPurchaseOrder />,
  },
  {
    path: '/po/:id',
    name: 'PO Details',
    icon: <FaFileAlt />,
    element: <PODetails />,
    isSidebarActive: false,
  },
  {
    path: '/po/:id/edit',
    name: 'Edit Purchase Order',
    icon: <FaFileAlt />,
    isSidebarActive: false,
    element: <AddPurchaseOrder />,
  },
];
