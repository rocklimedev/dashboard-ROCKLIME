import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  useGetAllQueriesQuery,
  useReplyToEmailMutation,
} from "../../api/contactApi";
import EmailItem from "./EmailItem";
import SidebarCategory from "./SidebarCategory"; // Assuming this is a component
import LabelItem from "./LabelItem"; // Assuming this is a component
import FolderItem from "./FolderItem"; // Assuming this is a component
import { setActiveCategory } from "../../api/emailSlice";
import {
  EditOutlined,
  SearchOutlined,
  SettingOutlined,
  ReloadOutlined,
  TagOutlined,
  TagsOutlined,
  FolderOutlined,
} from "@ant-design/icons";
const EmailInterface = () => {
  // Redux state and dispatch
  const dispatch = useDispatch();
  const activeCategory = useSelector(
    (state) => state.email?.activeCategory || "Inbox"
  );

  // State for UI toggles
  const [showMoreCategories, setShowMoreCategories] = useState(false);
  const [showMoreLabels, setShowMoreLabels] = useState(false);
  const [showMoreFolders, setShowMoreFolders] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [selectedQueryId, setSelectedQueryId] = useState(null);
  const [replySubject, setReplySubject] = useState("");
  const [replyMessage, setReplyMessage] = useState("");

  // RTK Query hooks
  const { data: response, isLoading, error } = useGetAllQueriesQuery();
  const [
    replyToEmail,
    {
      isLoading: isReplying,
      isError: isReplyError,
      error: replyError,
      isSuccess: isReplySuccess,
    },
  ] = useReplyToEmailMutation();

  // Static data for sidebar
  const categories = [
    { name: "Inbox", icon: "ti-inbox", count: 56, badgeClass: "badge-danger" },
    { name: "Starred", icon: "ti-star", count: 46, badgeClass: "text-gray" },
    { name: "Sent", icon: "ti-rocket", count: 14, badgeClass: "text-gray" },
    { name: "Drafts", icon: "ti-file", count: 12, badgeClass: "text-gray" },
    { name: "Deleted", icon: "ti-trash", count: 8, badgeClass: "text-gray" },
    {
      name: "Spam",
      icon: "ti-info-octagon",
      count: 0,
      badgeClass: "text-gray",
    },
  ];

  const moreCategories = [
    {
      name: "Important",
      icon: "ti-location-up",
      count: 12,
      badgeClass: "text-gray",
    },
    {
      name: "All Emails",
      icon: "ti-transition-top",
      count: 34,
      badgeClass: "text-gray",
    },
  ];

  const labels = [
    { name: "Team Events", color: "success" },
    { name: "Work", color: "warning" },
    { name: "External", color: "danger" },
    { name: "Projects", color: "skyblue" },
  ];

  const moreLabels = [
    { name: "Applications", color: "purple" },
    { name: "Design", color: "info" },
  ];

  const folders = [
    { name: "Projects", color: "danger" },
    { name: "Personal", color: "warning" },
    { name: "Finance", color: "success" },
  ];

  const moreFolders = [
    { name: "Projects", color: "info" },
    { name: "Personal", color: "primary" },
  ];

  // Handle reply form submission
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
      dispatch(setActiveCategory("Inbox")); // Reset to Inbox
    } catch (err) {
      alert(`Failed to send reply: ${err?.data?.message || "Unknown error"}`);
    }
  };

  // Handle reply button click
  const handleReplyClick = (queryId) => {
    setSelectedQueryId(queryId);
    setShowReplyForm(true);
  };

  // Handle loading and error states
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading queries: {error.message}</div>;

  // Filter queries based on activeCategory
  const queries = Array.isArray(response?.data) ? response.data : [];
  const filteredQueries =
    activeCategory === "Inbox"
      ? queries
      : queries.filter((query) =>
          activeCategory === "Unresponded" ? !query.responded : query.responded
        );

  return (
    <div className="page-wrapper">
      <div className="content p-0">
        <div className="d-md-flex">
          {/* Sidebar */}
          <div className="email-sidebar border-end border-bottom">
            <div className="active slimscroll h-100">
              <div className="slimscroll-active-sidebar">
                <div className="p-3">
                  {/* User Profile */}
                  <div className="shadow-md bg-white rounded p-2 mb-4">
                    <div className="d-flex align-items-center">
                      <a
                        href="#"
                        className="avatar avatar-md flex-shrink-0 me-2"
                      >
                        <img
                          src="assets/img/profiles/avatar-02.jpg"
                          className="rounded-circle"
                          alt="User"
                        />
                      </a>
                      <div>
                        <h6 className="mb-1">
                          <a href="#">James Hong</a>
                        </h6>
                        <p>
                          <a href="mailto:james.hong@example.com">
                            james.hong@example.com
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Compose Button */}
                  <a
                    href="#"
                    className="btn btn-primary w-100"
                    id="compose_mail"
                  >
                    <EditOutlined />
                    Compose
                  </a>

                  {/* Email Categories */}
                  <div className="mt-4">
                    <h5 className="mb-2">Emails</h5>
                    <div className="d-block mb-4 pb-4 border-bottom email-tags">
                      {categories.map((category) => (
                        <SidebarCategory
                          key={category.name}
                          category={category}
                          isActive={activeCategory === category.name}
                          onClick={() =>
                            dispatch(setActiveCategory(category.name))
                          }
                        />
                      ))}
                      {showMoreCategories &&
                        moreCategories.map((category) => (
                          <SidebarCategory
                            key={category.name}
                            category={category}
                            isActive={activeCategory === category.name}
                            onClick={() =>
                              dispatch(setActiveCategory(category.name))
                            }
                          />
                        ))}
                      <div className="view-all mt-2">
                        <a
                          href="#"
                          className="viewall-button fw-medium"
                          onClick={() =>
                            setShowMoreCategories(!showMoreCategories)
                          }
                        >
                          <span>
                            {showMoreCategories ? "Show Less" : "Show More"}
                          </span>
                          <i
                            className={`fa fa-chevron-${
                              showMoreCategories ? "up" : "down"
                            } fs-10 ms-2`}
                          ></i>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Labels */}
                  <div className="border-bottom mb-4 pb-4">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <h5>Labels</h5>
                      <a href="#">
                        <TagsOutlined />
                      </a>
                    </div>
                    {labels.map((label) => (
                      <LabelItem key={label.name} label={label} />
                    ))}
                    {showMoreLabels &&
                      moreLabels.map((label) => (
                        <LabelItem key={label.name} label={label} />
                      ))}
                    <div className="view-all mt-2">
                      <a
                        href="#"
                        className="viewall-button-2 fw-medium"
                        onClick={() => setShowMoreLabels(!showMoreLabels)}
                      >
                        <span>
                          {showMoreLabels ? "Show Less" : "Show More"}
                        </span>
                        <i
                          className={`fa fa-chevron-${
                            showMoreLabels ? "up" : "down"
                          } fs-10 ms-2`}
                        ></i>
                      </a>
                    </div>
                  </div>

                  {/* Folders */}
                  <div className="border-bottom mb-4 pb-4">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <h5>Folders</h5>
                      <a href="#">
                        <FolderOutlined />
                      </a>
                    </div>
                    {folders.map((folder) => (
                      <FolderItem key={folder.name} folder={folder} />
                    ))}
                    {showMoreFolders &&
                      moreFolders.map((folder) => (
                        <FolderItem key={folder.name} folder={folder} />
                      ))}
                    <div className="view-all mt-2">
                      <a
                        href="#"
                        className="viewall-button-3 fw-medium"
                        onClick={() => setShowMoreFolders(!showMoreFolders)}
                      >
                        <span>
                          {showMoreFolders ? "Show Less" : "Show More"}
                        </span>
                        <i
                          className={`fa fa-chevron-${
                            showMoreFolders ? "up" : "down"
                          } fs-10 ms-2`}
                        ></i>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white flex-fill border-end border-bottom mail-notifications">
            <div className="active slimscroll h-100">
              <div className="slimscroll-active-sidebar">
                <div className="p-3">
                  <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3">
                    <div>
                      <h5 className="mb-1">{activeCategory}</h5>
                      <div className="d-flex align-items-center">
                        <span>{filteredQueries.length} Queries</span>
                        <TagOutlined />
                        <span>
                          {
                            filteredQueries.filter((query) => !query.responded)
                              .length
                          }{" "}
                          Unresponded
                        </span>
                      </div>
                    </div>
                    <div className="d-flex align-items-center">
                      <div className="position-relative input-icon me-3">
                        <span className="input-icon-addon">
                          <SearchOutlined />
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Search Queries"
                        />
                      </div>
                      <div className="d-flex align-items-center">
                        <a
                          href="#"
                          className="btn btn-icon btn-sm rounded-circle"
                        >
                          <EditOutlined />
                        </a>
                        <a
                          href="#"
                          className="btn btn-icon btn-sm rounded-circle"
                        >
                          <SettingOutlined />
                        </a>
                        <a
                          href="#"
                          className="btn btn-icon btn-sm rounded-circle"
                        >
                          <ReloadOutlined />
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
                            {replyError?.data?.message ||
                              "Failed to send reply"}
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

                  {/* Email List */}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailInterface;
