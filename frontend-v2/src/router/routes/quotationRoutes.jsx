import { lazy } from 'react';
// src/routes/quotationRoutes.js
import { FaTags } from 'react-icons/fa';
const QuotationList = lazy(() => import('../../concepts/Quotation/QuotationList'));
const AddQuotation = lazy(() => import('../../concepts/Quotation/AddQuntation'));
const NewQuotationsDetails = lazy(() => import('../../concepts/Quotation/NewQuotationDetails'));

export const quotationRoutes = [
  {
    path: '/quotation/add',
    name: 'Add Quotations',
    icon: <FaTags />,
    element: <AddQuotation />,
    isSidebarActive: false,
  },
  {
    path: '/quotation/:id',
    name: 'Quotations Details',
    icon: <FaTags />,
    isSidebarActive: false,
    element: <NewQuotationsDetails />,
  },
  {
    path: '/quotation/:id/edit',
    name: 'Edit Quotations',
    icon: <FaTags />,
    element: <AddQuotation />,
    isSidebarActive: false,
  },
];
