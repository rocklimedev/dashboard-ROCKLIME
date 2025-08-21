import React, { useState, useCallback } from "react";
import PageHeader from "../Common/PageHeader";
import {
  useGetAllQueriesQuery,
  useDeleteQueryMutation,
} from "../../api/contactApi";
import { AiOutlineEye, AiOutlineDelete } from "react-icons/ai";
import DeleteModal from "../Common/DeleteModal";
import { toast } from "sonner";
import DataTablePagination from "../Common/DataTablePagination";

const ContactWrapper = () => {
  const { data, error, isLoading, refetch } = useGetAllQueriesQuery();
  const [deleteQuery, { isLoading: isDeleting }] = useDeleteQueryMutation();

  // Ensure queries is an array; fallback to empty array if undefined
  const queries = Array.isArray(data?.data) ? data.data : [];

  // State
  const [queryToDelete, setQueryToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Format for table
  const formattedQueries = queries.map((query) => ({
    id: query._id, // Use _id from API response
    name: `${query.firstName} ${query.lastName}`, // Combine firstName and lastName
    email: query.email,
    message: query.message,
    createdAt: new Date(query.createdAt).toLocaleDateString(),
  }));

  // Handle delete
  const handleDeleteQuery = useCallback((query) => {
    setQueryToDelete(query);
    setShowDeleteModal(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!queryToDelete?.id) {
      toast.error("No query selected for deletion");
      setShowDeleteModal(false);
      return;
    }
    try {
      await deleteQuery(queryToDelete.id).unwrap();
      toast.success("Query deleted successfully");
      setShowDeleteModal(false);
      setQueryToDelete(null);
      // Only adjust currentPage if necessary
      if (formattedQueries.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      }
      // Refetch after state updates to avoid re-render conflicts
      refetch();
    } catch (err) {
      toast.error(
        `Failed to delete query: ${
          err?.data?.message || err?.message || "Unknown error"
        }`
      );
      setShowDeleteModal(false);
      setQueryToDelete(null);
    }
  }, [
    queryToDelete,
    deleteQuery,
    refetch,
    formattedQueries.length,
    currentPage,
  ]);

  // Handle page change
  const handlePageChange = useCallback((pageNumber) => {
    setCurrentPage(pageNumber);
  }, []);

  // Paginated data
  const paginatedQueries = formattedQueries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Loading
  if (isLoading) {
    return (
      <div className="page-wrapper">
        <div className="content text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading queries...</p>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="page-wrapper">
        <div className="content text-center">
          <p className="text-danger">
            Error fetching queries:{" "}
            {error?.data?.message || error?.error || "Unknown error"}
          </p>
          <button className="btn btn-primary mt-2" onClick={refetch}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty
  if (queries.length === 0) {
    return (
      <div className="page-wrapper">
        <div className="content text-center">
          <p>No queries available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title="Contact Queries"
          subtitle="Manage customer queries"
          tableData={formattedQueries}
        />
        <div className="card">
          <div className="card-body-2">
            {paginatedQueries.map((query) => (
              <div className="card-list" key={query.id}>
                <div className="card-content">
                  <span>
                    {query.name} ({query.email})
                  </span>
                  <div className="actions">
                    <AiOutlineEye
                      className="action-icon view-icon"
                      onClick={() => toast.info(`Message: ${query.message}`)}
                      aria-label={`View ${query.name}`}
                    />
                    <AiOutlineDelete
                      className="action-icon delete-icon"
                      onClick={() => handleDeleteQuery(query)}
                      aria-label={`Delete ${query.name}`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="card-footer">
            <DataTablePagination
              totalItems={queries.length}
              itemNo={itemsPerPage}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <DeleteModal
          item={queryToDelete}
          itemType="Query"
          isVisible={showDeleteModal}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setQueryToDelete(null);
          }}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};

export default ContactWrapper;
