import { lazy } from 'react';
// src/routes/customerRoutes.js
import { FaUsers } from 'react-icons/fa';
const CustomerDetails = lazy(() => import('../../concepts/Customers/CustomerDetails'));
const AddCustomer = lazy(() => import('../../concepts/Customers/AddCustomer'));

export const customerRoutes = [
  {
    path: '/customer/:id',
    name: 'Customer Details',
    icon: <FaUsers />,
    isSidebarActive: false,
    element: <CustomerDetails />,
  },
  {
    path: '/customer/add',
    name: 'Add Customer',
    icon: <FaUsers />,
    isSidebarActive: false,
    element: <AddCustomer />,
  },
  {
    path: '/customer/edit/:customerId',
    name: 'Edit Customer',
    icon: <FaUsers />,
    isSidebarActive: false,
    element: <AddCustomer />,
  },
];
