import ListToolbar from '../../components/Common/ListToolbar';
import ListPagination from '../../components/Common/ListPagination';
import './CustomerList.styles.css';
import React, { useState, useEffect } from 'react';
import { useGetCustomersQuery, useDeleteCustomerMutation } from '../../api/customerApi';
import Avatar from 'react-avatar';
import { BiTrash } from 'react-icons/bi';
import { EyeOutlined, EditOutlined, MoreOutlined } from '@ant-design/icons';
import { Button, Dropdown, Menu, Segmented, Space, Tag } from 'antd';
import { toast } from 'sonner';
import DeleteModal from '../../components/Common/DeleteModal';
import PageHeader from '../../components/Common/PageHeader';

const Checkable = Tag.CheckableTag;
import { useNavigate } from 'react-router-dom';
import PermissionGate from '../../context/PermissionGate';

const CustomerList = () => {
  const navigate = useNavigate();

  // State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerTypeFilter, setCustomerTypeFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Recently Added');
  const [statusFilter, setStatusFilter] = useState('ALL');
  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // RTK Query
  const {
    data: response,
    error,
    isLoading,
    isFetching,
  } = useGetCustomersQuery({
    page: currentPage,
    limit: pageSize,
    search: debouncedSearch || undefined,
    type: customerTypeFilter !== 'All' ? customerTypeFilter : undefined,
    owes: statusFilter === 'OWES' ? '1' : undefined,
    sort: {
      'Recently Added': 'recent',
      Ascending: 'name_asc',
      Descending: 'name_desc',
      Oldest: 'oldest',
    }[sortBy],
  });

  const customers = response?.data || [];
  const pagination = response?.pagination || {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  };

  const [deleteCustomer] = useDeleteCustomerMutation();

  const customerTypes = [
    { value: 'All', label: 'All Customers' },
    { value: 'Retail', label: 'Retail' },
    { value: 'Architect', label: 'Architect' },
    { value: 'Interior', label: 'Interior' },
    { value: 'Builder', label: 'Builder' },
    { value: 'Contractor', label: 'Contractor' },
  ];

  // filtering and sorting happen on the server (all customers, not just this page)
  const filteredCustomers = customers;

  // Handlers
  const handlePageChange = (page, newPageSize) => {
    setCurrentPage(page);
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize);
      setCurrentPage(1);
    }
  };

  const handleAddCustomer = () => navigate('/customer/add');

  const handleEditCustomer = (customer) => {
    navigate(`/customer/edit/${customer.customerId}`, { state: { customer } });
  };

  const handleDelete = (customerId) => {
    setCustomerToDelete(customerId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!customerToDelete) return;

    try {
      await deleteCustomer(customerToDelete).unwrap();
      toast.success('Customer deleted successfully');

      if (filteredCustomers.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (err) {
      const msg = err?.data?.message || 'Failed to delete customer';
      if (msg.toLowerCase().includes('quotation')) {
        toast.error('Cannot delete — customer has linked quotations.');
      } else {
        toast.error(msg);
      }
    } finally {
      setShowDeleteModal(false);
      setCustomerToDelete(null);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCustomerTypeFilter('All');
    setStatusFilter('ALL');
    setSortBy('Recently Added');
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="content p-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading customers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content p-4">
        <div className="alert alert-danger">
          Error: {error?.data?.message || 'Failed to load customers'}
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title="Customers"
          subtitle="Manage your customer database"
          onAdd={handleAddCustomer}
        />

        <div className="card-body">
          {/* Filters */}
          <ListToolbar
            exportTitle={'Customers'}
            exportData={filteredCustomers.map((c) => ({
              Name: c.name,
              Email: c.email,
              Phone: c.phone ?? c.mobileNumber,
              Type: c.customerType,
              'Business value': c.businessValue,
              Due: c.due,
            }))}
            search={{
              placeholder: 'Search name, email, phone...',
              value: searchTerm,
              onChange: (e) => setSearchTerm(e.target.value),
              size: 'large',
              allowClear: true,
            }}
            filters={[
              {
                key: 'customer-type',
                type: 'custom',
                content: (
                  <Space wrap size={8}>
                    <Segmented
                      value={customerTypeFilter}
                      onChange={(val) => {
                        setCustomerTypeFilter(val);
                        setCurrentPage(1);
                      }}
                      options={customerTypes.map((t) => ({
                        value: t.value,
                        label: t.value === 'All' ? 'All' : t.label,
                      }))}
                    />
                    <Checkable
                      checked={statusFilter === 'OWES'}
                      onChange={(on) => {
                        setStatusFilter(on ? 'OWES' : 'ALL');
                        setCurrentPage(1);
                      }}
                    >
                      Owes money
                    </Checkable>
                  </Space>
                ),
              },
              {
                key: 'sort',
                type: 'select',
                props: {
                  value: sortBy,
                  onChange: setSortBy,
                  size: 'large',
                  options: [
                    { value: 'Recently Added', label: 'Newest first' },
                    { value: 'Oldest', label: 'Oldest first' },
                    { value: 'Ascending', label: 'Name: A to Z' },
                    { value: 'Descending', label: 'Name: Z to A' },
                  ],
                },
              },
            ]}
            onClear={clearFilters}
          />

          {/* Loading indicator */}
          {isFetching && !isLoading && (
            <div className="text-center my-3">
              <span className="text-muted">Updating...</span>
            </div>
          )}

          {/* LIST VIEW */}
          <div className="table-responsive">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-muted">No customers found.</p>
              </div>
            ) : (
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Customer</th>
                    <th>Contact</th>
                    <th>Quotations</th>
                    <th>Orders</th>
                    <th title="Orders won (not cancelled) plus quotations not yet converted">
                      Business Value
                    </th>
                    <th>Owes</th>
                    <th>Last order</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((c) => (
                    <tr key={c.customerId}>
                      <td>
                        <div className="d-flex align-items-center gap-3">
                          <Avatar
                            name={c.name || c.companyName}
                            round
                            size="40"
                            color="#e31e24"
                            fgColor="#fff"
                          />

                          <div>
                            <a
                              href={`/customer/${c.customerId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="fw-semibold text-primary d-block"
                            >
                              {c.name || 'Unnamed Customer'}
                            </a>

                            {c.companyName && <small className="text-muted">{c.companyName}</small>}
                            <span className="badge bg-light text-dark">
                              {c.customerType || 'Retail'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div>
                          <div>{c.mobileNumber || ''}</div>
                          <small className="text-muted">{c.email || ''}</small>
                        </div>
                      </td>

                      <td>
                        {Number(c.quotationValue || 0) > 0 || Number(c.quotations || 0) > 0 ? (
                          <small className="text-muted">
                            ₹{Number(c.quotationValue || 0).toLocaleString('en-IN')} (
                            {c.quotations || 0})
                          </small>
                        ) : (
                          ''
                        )}
                      </td>

                      <td>
                        {Number(c.orderValue || 0) > 0 || Number(c.orders || 0) > 0 ? (
                          <small className="text-success">
                            ₹{Number(c.orderValue || 0).toLocaleString('en-IN')} ({c.orders || 0})
                          </small>
                        ) : (
                          ''
                        )}
                      </td>
                      <td>
                        {Number(c.businessValue || 0) > 0 ? (
                          <div className="small">
                            ₹
                            {Number(c.businessValue || 0).toLocaleString('en-IN', {
                              maximumFractionDigits: 2,
                            })}
                          </div>
                        ) : (
                          ''
                        )}
                      </td>
                      <td>
                        {Number(c.due || 0) > 0.5 ? (
                          <small className="text-danger fw-semibold">
                            ₹{Math.round(Number(c.due)).toLocaleString('en-IN')}
                          </small>
                        ) : (
                          <small className="text-muted">—</small>
                        )}
                      </td>
                      <td>
                        <small className="text-muted">
                          {c.lastOrder
                            ? new Date(c.lastOrder).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '—'}
                        </small>
                      </td>

                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-2">
                          <PermissionGate api="edit" module="customers">
                            <Button
                              size="small"
                              icon={<EditOutlined />}
                              onClick={() => handleEditCustomer(c)}
                            />
                          </PermissionGate>

                          <PermissionGate api="view|delete" module="customers">
                            <Dropdown
                              trigger={['click']}
                              overlay={
                                <Menu>
                                  <PermissionGate api="view" module="customers">
                                    <Menu.Item key="view">
                                      <a
                                        href={`/customer/${c.customerId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <EyeOutlined className="me-2" />
                                        View
                                      </a>
                                    </Menu.Item>
                                  </PermissionGate>

                                  <PermissionGate api="delete" module="customers">
                                    <Menu.Item
                                      key="delete"
                                      danger
                                      onClick={() => handleDelete(c.customerId)}
                                    >
                                      <BiTrash className="me-2" />
                                      Delete
                                    </Menu.Item>
                                  </PermissionGate>
                                </Menu>
                              }
                            >
                              <Button size="small" type="text" icon={<MoreOutlined />} />
                            </Dropdown>
                          </PermissionGate>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {pagination.total > 0 && (
            <ListPagination
              itemLabel="customers"
              current={currentPage}
              pageSize={pageSize}
              total={pagination.total}
              onChange={handlePageChange}
              showSizeChanger
              disabled={isFetching}
            />
          )}
        </div>

        <DeleteModal
          isVisible={showDeleteModal}
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setCustomerToDelete(null);
          }}
          itemType="Customer"
        />
      </div>
    </div>
  );
};

export default CustomerList;
