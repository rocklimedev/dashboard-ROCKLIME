import ListToolbar from '../../components/Common/ListToolbar';
import ListPagination from '../../components/Common/ListPagination';
import './JobsList.styles.css';
import React, { useState } from 'react';
import { EyeOutlined, DeleteOutlined, StopOutlined, MoreOutlined } from '@ant-design/icons';
import { useGetAllJobsQuery, useCancelJobMutation, useDeleteJobMutation } from '../../api/jobsApi';

import { Dropdown, Menu, Button, Tooltip } from 'antd';
import { toast } from 'sonner';

import PageHeader from '../../components/Common/PageHeader';
import DeleteModal from '../../components/Common/DeleteModal';

const JobList = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState();
  const [typeFilter, setTypeFilter] = useState();
  const [searchTerm, setSearchTerm] = useState('');

  const [deleteId, setDeleteId] = useState(null);
  const [deleteModal, setDeleteModal] = useState(false);

  const { data, refetch, isFetching } = useGetAllJobsQuery({
    page,
    limit: 10,
    status: statusFilter,
    type: typeFilter,
  });

  const [cancelJob] = useCancelJobMutation();
  const [deleteJob, { isLoading: isDeleting }] = useDeleteJobMutation();

  const jobs = data?.data || [];
  // The jobs endpoint has no search parameter: search the visible page explicitly.
  const filteredJobs = jobs.filter((job) =>
    [job.id, job.type, job.status].some((value) =>
      String(value ?? '')
        .toLowerCase()
        .includes(searchTerm.trim().toLowerCase()),
    ),
  );
  const pagination = data?.pagination || {};

  const handleCancel = async (id) => {
    try {
      await cancelJob(id).unwrap();
      toast.success('Job cancelled');
      refetch();
    } catch {
      toast.error('Failed to cancel job');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteJob(deleteId).unwrap();
      toast.success('Job deleted');
      refetch();
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleteModal(false);
      setDeleteId(null);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: 'secondary',
      processing: 'info',
      completed: 'success',
      failed: 'danger',
      cancelled: 'warning',
    };
    return `badge bg-${map[status] || 'secondary'}`;
  };

  const renderProgress = (progress) => {
    if (!progress) return '—';

    const { totalRows = 0, processedRows = 0 } = progress;
    const percent = totalRows > 0 ? Math.round((processedRows / totalRows) * 100) : 0;

    return (
      <div className="fv2-jobslist-46ab9814a9">
        <div className="progress fv2-jobslist-4c25c77547">
          <div className="progress-bar" style={{ width: `${percent}%` }} />
        </div>
        <small className="text-muted">
          {processedRows}/{totalRows}
        </small>
      </div>
    );
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="card">
          <PageHeader
            title="Jobs Management"
            subtitle="Monitor background jobs"
            onAdd={() => (window.location.href = '/import-job')}
          />

          <div className="card-body">
            {/* Filters */}
            <ListToolbar
              onClear={() => {
                setSearchTerm('');
                setStatusFilter(undefined);
                setTypeFilter(undefined);
                setPage(1);
              }}
              exportTitle={'Jobs'}
              exportData={filteredJobs.map((j) => ({
                ID: j.id,
                Type: j.type,
                Status: j.status,
                Processed: j.progress?.processedRows,
                Total: j.progress?.totalRows,
                Created: j.createdAt,
              }))}
              search={{
                placeholder: 'Search jobs on this page...',
                value: searchTerm,
                allowClear: true,
                onChange: (e) => setSearchTerm(e.target.value),
              }}
              filters={[
                {
                  key: 'status',
                  type: 'select',
                  props: {
                    placeholder: 'Status',
                    allowClear: true,
                    value: statusFilter,
                    onChange: (value) => {
                      setStatusFilter(value);
                      setPage(1);
                    },
                    options: [
                      { value: 'pending', label: 'Pending' },
                      { value: 'processing', label: 'Processing' },
                      { value: 'completed', label: 'Completed' },
                      { value: 'failed', label: 'Failed' },
                      { value: 'cancelled', label: 'Cancelled' },
                    ],
                  },
                },
                {
                  key: 'type',
                  type: 'select',
                  props: {
                    placeholder: 'Type',
                    allowClear: true,
                    value: typeFilter,
                    onChange: (value) => {
                      setTypeFilter(value);
                      setPage(1);
                    },
                    options: [
                      { value: 'bulk-import', label: 'Bulk Import' },
                      { value: 'report-generation', label: 'Report Generation' },
                    ],
                  },
                },
              ]}
            />

            {/* Table */}
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>Results</th>
                    <th>Created</th>
                    <th className="fv2-jobslist-14b0d753c5">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {!filteredJobs.length && !isFetching && (
                    <tr>
                      <td colSpan={6} className="text-center text-muted py-4">
                        No jobs match this page.
                      </td>
                    </tr>
                  )}
                  {filteredJobs.map((job) => {
                    const menu = (
                      <Menu>
                        <Menu.Item onClick={() => window.open(`/job/${job.id}`, '_blank')}>
                          <EyeOutlined /> View
                        </Menu.Item>

                        {['pending', 'processing'].includes(job.status) && (
                          <Menu.Item onClick={() => handleCancel(job.id)}>
                            <StopOutlined /> Cancel
                          </Menu.Item>
                        )}

                        {['completed', 'failed', 'cancelled'].includes(job.status) && (
                          <Menu.Item
                            danger
                            onClick={() => {
                              setDeleteId(job.id);
                              setDeleteModal(true);
                            }}
                          >
                            <DeleteOutlined /> Delete
                          </Menu.Item>
                        )}
                      </Menu>
                    );

                    return (
                      <tr key={job.id}>
                        <td className="text-capitalize">{job.type?.replace(/-/g, ' ')}</td>

                        <td>
                          <span className={getStatusBadge(job.status)}>{job.status}</span>
                        </td>

                        <td>{renderProgress(job.progress)}</td>

                        <td>
                          {job.results ? (
                            <span className="badge bg-light text-dark">
                              +{job.results.newBrandsCount || 0} Brands
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>

                        <td className="text-muted">{new Date(job.createdAt).toLocaleString()}</td>

                        <td>
                          <Dropdown overlay={menu} trigger={['click']}>
                            <Button type="text" icon={<MoreOutlined />} />
                          </Dropdown>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <ListPagination
              itemLabel="jobs"
              showSummary={!searchTerm.trim()}
              current={pagination.page ?? page}
              total={pagination.total}
              pageSize={pagination.limit ?? 10}
              disabled={isFetching}
              onChange={setPage}
            />
          </div>
        </div>

        {/* Delete Modal */}
        <DeleteModal
          isVisible={deleteModal}
          onCancel={() => setDeleteModal(false)}
          onConfirm={handleDelete}
          itemType="Job"
          isLoading={isDeleting}
        />
      </div>
    </div>
  );
};

export default JobList;
