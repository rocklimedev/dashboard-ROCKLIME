import React, { useState } from "react";
import { useSelector } from "react-redux";
import {
  useGetAllQueriesQuery,
  useReplyToEmailMutation,
} from "../../api/contactApi";
import EmailItem from "./EmailItem";

const EmailList = () => {
  const { data: response, isLoading, error } = useGetAllQueriesQuery();
  const activeCategory = useSelector(
    (state) => state.email?.activeCategory || "Inbox"
  );
  const [selectedQueryId, setSelectedQueryId] = useState(null);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replySubject, setReplySubject] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [
    replyToEmail,
    {
      isLoading: isReplying,
      isError: isReplyError,
      error: replyError,
      isSuccess: isReplySuccess,
    },
  ] = useReplyToEmailMutation();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading queries: {error.message}</div>;

  // Use response.data as the array of queries
  const queries = Array.isArray(response?.data) ? response.data : [];
  // Filter queries based on activeCategory or other criteria (e.g., responded)
  const filteredQueries =
    activeCategory === "Inbox"
      ? queries
      : queries.filter((query) => {
          // Example: Filter based on responded status or other criteria
          return activeCategory === "Unresponded"
            ? !query.responded
            : query.responded;
        });

  const handleReplyClick = (queryId) => {
    setSelectedQueryId(queryId);
    setShowReplyForm(true);
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!selectedQueryId) {
      alert("No query selected.");
      return;
    }
    try {
      await replyToEmail({
        id: selectedQueryId,
        replyData: { subject: replySubject, replyMessage },
      }).unwrap();
      alert("Reply sent successfully!");
      setReplySubject("");
      setReplyMessage("");
      setShowReplyForm(false);
      setSelectedQueryId(null);
    } catch (err) {
      console.error("Error sending reply:", err);
      alert(`Failed to send reply: ${err?.data?.message || "Unknown error"}`);
    }
  };

  return (
    <div className="bg-white flex-fill border-end border-bottom mail-notifications">
      <div className="active slimscroll h-100">
        <div className="slimscroll-active-sidebar">
          <div className="p-3">
            <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <div>
                <h5 className="mb-1">{activeCategory}</h5>
                <div className="d-flex align-items-center">
                  <span>{filteredQueries.length} Queries</span>
                  <i className="ti ti-point-filled text-primary mx-1"></i>
                  <span>
                    {filteredQueries.filter((query) => !query.responded).length}{" "}
                    Unresponded
                  </span>
                </div>
              </div>
              <div className="d-flex align-items-center">
                <div className="position-relative input-icon me-3">
                  <span className="input-icon-addon">
                    <i className="ti ti-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search Queries"
                  />
                </div>
                <div className="d-flex align-items-center">
                  <a
                    href="javascript:void(0);"
                    className="btn btn-icon btn-sm rounded-circle"
                  >
                    <i className="ti ti-filter-edit"></i>
                  </a>
                  <a
                    href="javascript:void(0);"
                    className="btn btn-icon btn-sm rounded-circle"
                  >
                    <i className="ti ti-settings"></i>
                  </a>
                  <a
                    href="javascript:void(0);"
                    className="btn btn-icon btn-sm rounded-circle"
                  >
                    <i className="ti ti-refresh"></i>
                  </a>
                </div>
              </div>
            </div>
            {/* Reply Form */}
            {showReplyForm && selectedQueryId && (
              <div className="bg-light rounded p-3 mt-3 mb-4">
                <form onSubmit={handleReplySubmit}>
                  <div className="mb-2">
                    <label className="form-label">Subject</label>
                    <input
                      type="text"
                      className="form-control"
                      value={replySubject}
                      onChange={(e) => setReplySubject(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label">Reply Message</label>
                    <textarea
                      className="form-control"
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={isReplying}
                  >
                    {isReplying ? "Sending..." : "Send Reply"}
                  </button>
                  {isReplyError && (
                    <p className="text-danger mt-2">
                      Error:{" "}
                      {replyError?.data?.message || "Failed to send reply"}
                    </p>
                  )}
                  {isReplySuccess && (
                    <p className="text-success mt-2">
                      Reply sent successfully!
                    </p>
                  )}
                </form>
              </div>
            )}
          </div>
          <div className="list-group list-group-flush mails-list">
            {filteredQueries.map((query) => (
              <div key={query._id} className="list-group-item">
                <EmailItem
                  email={query}
                  onReplyClick={() => handleReplyClick(query._id)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailList;
