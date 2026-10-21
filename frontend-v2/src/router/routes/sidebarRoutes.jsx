import { lazy } from 'react';
import ZohoConnectionGate from '../../components/CRM/ZohoConnectionGate';
import {
  FaHome,
  FaTags,
  FaFileAlt,
  FaUsers,
  FaThLarge,
  FaUser,
  FaListUl,
  FaIdCard,
  FaBoxOpen,
} from 'react-icons/fa';

import { MdOutlineInventory2, MdLocalActivity } from 'react-icons/md';

import { FaShoppingCart, FaStore } from 'react-icons/fa';

const CategoryManagement = lazy(() => import('../../concepts/Products/CategoryManagement'));
const PurchaseManagement = lazy(() => import('../../concepts/PO/PurchaseManagement'));
const Product = lazy(() => import('../../concepts/Products/Product'));
const OrderWrapper = lazy(() => import('../../concepts/Order/OrderWrapper'));
const QuotationList = lazy(() => import('../../concepts/Quotation/QuotationList'));
const StockPage = lazy(() => import('../../concepts/Stock/StockPage'));
const UserList = lazy(() => import('../../concepts/User/UserList'));
const RolePermission = lazy(() => import('../../concepts/RBAC/RolePermission'));
const CustomerList = lazy(() => import('../../concepts/Customers/CustomerList'));
const BrandList = lazy(() => import('../../concepts/Brands/BrandsList'));
const ReportsPage = lazy(() => import('../../concepts/Reports/ReportsHub'));
const PdfReportsPage = lazy(() => import('../../concepts/Reports/page'));
const ActivityLogsPage = lazy(() => import('../../concepts/Activity/page'));
const ReportDashboard = lazy(() => import('../../concepts/Home/ReportDashboard'));
const NewDashboard = lazy(() => import('../../concepts/Home/NewPageWrapper'));
const DispatchHistory = lazy(() => import('../../concepts/Order/DispatchHistory'));
import { useAuth } from '../../context/AuthContext';
const Operations = lazy(() => import('../../concepts/Operations/Operations'));
const AppsHome = lazy(() => import('../../apps/AppsHome'));
const OpsToday = lazy(() => import('../../concepts/Operations/OpsToday'));
const StockEntry = lazy(() => import('../../concepts/Operations/StockEntry'));
const ReceiveGoods = lazy(() => import('../../concepts/Operations/ReceiveGoods'));
const GatePasses = lazy(() => import('../../concepts/Operations/GatePasses'));
const OrderFromQuotation = lazy(() => import('../../concepts/Order/OrderFromQuotation'));
const Catalogues = lazy(() => import('../../concepts/Catalogue/Catalogues'));
const CrmBoard = lazy(() => import('../../concepts/CRM/CrmBoard'));
const CrmFollowUps = lazy(() => import('../../concepts/CRM/CrmFollowUps'));
const CrmSettings = lazy(() => import('../../concepts/CRM/CrmSettings'));
const CatalogueViewer = lazy(() => import('../../concepts/Catalogue/CatalogueViewer'));
const MyDayPage = lazy(() => import('../../components/Home/MyDayPage'));

// ============================================================
// ROLE BASED DASHBOARD
// ============================================================

const RoleBasedDashboard = () => {
  const { auth } = useAuth();

  const roles = Array.isArray(auth?.user?.roles) ? auth.user.roles : [];

  const isAdmin = roles.includes('ADMIN') || roles.includes('SUPER_ADMIN');

  return isAdmin ? <ReportDashboard /> : <NewDashboard />;
};

// ============================================================
// SIDEBAR ROUTES
// ============================================================

export const sidebarRoutes = [
  {
    path: '/',
    name: 'Apps',
    icon: <FaHome />,
    isSidebarActive: true,
    element: <AppsHome />,
  },
  {
    path: '/orders/from-quotation',
    name: 'Order from quotation',
    isSidebarActive: false,
    element: <OrderFromQuotation />,
  },
  {
    path: '/crm',
    name: 'CRM',
    isSidebarActive: false,
    element: (
      <ZohoConnectionGate>
        <CrmBoard />
      </ZohoConnectionGate>
    ),
  },
  {
    path: '/crm/follow-ups',
    name: 'Follow-ups',
    isSidebarActive: false,
    element: (
      <ZohoConnectionGate>
        <CrmFollowUps />
      </ZohoConnectionGate>
    ),
  },
  {
    path: '/crm/settings',
    name: 'Bigin connection',
    isSidebarActive: false,
    element: <CrmSettings />,
  },
  {
    path: '/catalogues',
    name: 'Brand catalogues',
    isSidebarActive: false,
    element: <Catalogues />,
  },
  {
    path: '/catalogues/:id',
    name: 'Catalogue',
    isSidebarActive: false,
    element: <CatalogueViewer />,
  },
  { path: '/my-day', name: 'My day', isSidebarActive: false, element: <MyDayPage /> },
  // Operations app
  { path: '/operations', name: 'Operations', isSidebarActive: false, element: <OpsToday /> },
  {
    path: '/operations/stock-entry',
    name: 'Stock entry',
    isSidebarActive: false,
    element: <StockEntry />,
  },
  {
    path: '/inventory/stock-workspace',
    name: 'Stock entry & counts',
    isSidebarActive: false,
    element: <StockPage initialView="entries" />,
  },
  {
    path: '/operations/receive',
    name: 'Receive goods',
    isSidebarActive: false,
    element: <ReceiveGoods />,
  },
  {
    path: '/operations/gate-passes',
    name: 'Gate passes',
    isSidebarActive: false,
    element: <GatePasses />,
  },
  {
    path: '/dashboard',
    name: 'Sales dashboard',
    icon: <FaHome />,
    isSidebarActive: false,
    element: <RoleBasedDashboard />,
  },

  {
    path: '/category-selector',
    name: 'Products',
    element: <Product />,
    icon: <FaThLarge />,
    isSidebarActive: true,
  },

  {
    path: '/quotations/list',
    name: 'Quotations',
    icon: <FaTags />,
    element: <QuotationList />,
    isSidebarActive: true,
  },

  {
    path: '/orders/list',
    name: 'Orders',
    icon: <FaFileAlt />,
    element: <OrderWrapper />,
    isSidebarActive: true,
  },
  {
    path: '/orders/dispatch/all',
    name: 'Dispatch History',
    icon: <FaFileAlt />,
    element: <DispatchHistory />,
    isSidebarActive: true,
  },
  {
    path: '/purchase-manager',
    name: 'Purchase Manager',
    icon: <FaShoppingCart />,
    element: <PurchaseManagement />,
    isSidebarActive: true,
  },

  {
    path: '/inventory/counts/:id',
    name: 'Stock Count Workspace',
    isSidebarActive: false,
    element: <StockPage />,
  },

  {
    path: '/inventory/list',
    name: 'Inventory',
    icon: <MdOutlineInventory2 />,
    isSidebarActive: true,
    element: <StockPage />,
  },

  {
    path: '/customers/list',
    name: 'Customers',
    icon: <FaUsers />,
    isSidebarActive: true,
    element: <CustomerList />,
  },

  {
    path: '/reports/list',
    name: 'Reports',
    icon: <FaListUl />,
    isSidebarActive: true,
    element: <ReportsPage />,
  },
  {
    path: '/reports/pdf',
    name: 'PDF reports',
    isSidebarActive: false,
    element: <PdfReportsPage />,
  },
  {
    path: '/settings/maintenance',
    name: 'Maintenance tools',
    icon: <FaBoxOpen />,
    isSidebarActive: true,
    element: <Operations />,
  },
  {
    path: '#',
    name: 'Master Data',
    icon: <FaBoxOpen />,
    isSidebarActive: true,

    submenu: [
      {
        path: '/users/list',
        name: 'Users',
        icon: <FaUser />,
        isSidebarActive: true,
        element: <UserList />,
      },

      {
        path: '/meta/list',
        name: 'Meta',
        icon: <FaStore />,
        isSidebarActive: true,
        element: <BrandList />,
      },

      {
        path: '/categories-keywords/list',
        name: 'Categories',
        icon: <FaThLarge />,
        element: <CategoryManagement />,
        isSidebarActive: true,
      },

      {
        path: '/activity-logs',
        name: 'Activity Logs',
        icon: <MdLocalActivity />,
        isSidebarActive: true,
        element: <ActivityLogsPage />,
      },

      {
        path: '/roles-permission/list',
        name: 'Roles & Permissions',
        icon: <FaIdCard />,
        isSidebarActive: true,
        element: <RolePermission />,
      },
    ],
  },
];
