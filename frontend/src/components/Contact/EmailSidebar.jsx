import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setActiveCategory } from "../../api/emailSlice";
import { useReplyToEmailMutation } from "../../api/contactApi";
import SidebarCategory from "./SidebarCategory";
import LabelItem from "./LabelItem";
import FolderItem from "./FolderItem";

const EmailSidebar = ({ selectedContactId }) => {
  const dispatch = useDispatch();
  const activeCategory = useSelector(
    (state) => state.email?.activeCategory || "Inbox"
  );
  const [showMoreCategories, setShowMoreCategories] = useState(false);
  const [showMoreLabels, setShowMoreLabels] = useState(false);
  const [showMoreFolders, setShowMoreFolders] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replySubject, setReplySubject] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [replyToEmail, { isLoading, isError, error, isSuccess }] =
    useReplyToEmailMutation();

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

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!selectedContactId) {
      alert("No contact query selected.");
      return;
    }
    try {
      await replyToEmail({
        id: selectedContactId,
        replyData: { subject: replySubject, replyMessage },
      }).unwrap();
      alert("Reply sent successfully!");
      setReplySubject("");
      setReplyMessage("");
      setShowReplyForm(false);
      dispatch(setActiveCategory("Inbox")); // Reset to Inbox after reply
    } catch (err) {
      console.error("Error sending reply:", err);
      alert(`Failed to send reply: ${err?.data?.message || "Unknown error"}`);
    }
  };

  return (
    <div className="email-sidebar border-end border-bottom">
      <div className="active slimscroll h-100">
        <div className="slimscroll-active-sidebar">
          <div className="p-3">
            {/* User Profile */}
            <div className="shadow-md bg-white rounded p-2 mb-4">
              <div className="d-flex align-items-center">
                <a
                  href="javascript:void(0);"
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
                    <a href="javascript:void(0);">James Hong</a>
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
              href="javascript:void(0);"
              className="btn btn-primary w-100"
              id="compose_mail"
            >
              <i className="ti ti-edit me-2"></i>Compose
            </a>
            {/* Reply to Contact Button */}
            {selectedContactId && (
              <a
                href="javascript:void(0);"
                className="btn btn-secondary w-100 mt-2"
                onClick={() => setShowReplyForm(!showReplyForm)}
              >
                <i className="ti ti-reply me-2"></i>
                {showReplyForm ? "Cancel Reply" : "Reply to Contact"}
              </a>
            )}
            {/* Reply Form */}
            {showReplyForm && selectedContactId && (
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
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending..." : "Send Reply"}
                  </button>
                  {isError && (
                    <p className="text-danger mt-2">
                      Error: {error?.data?.message || "Failed to send reply"}
                    </p>
                  )}
                  {isSuccess && (
                    <p className="text-success mt-2">
                      Reply sent successfully!
                    </p>
                  )}
                </form>
              </div>
            )}
            {/* Email Categories */}
            <div className="mt-4">
              <h5 className="mb-2">Emails</h5>
              <div className="d-block mb-4 pb-4 border-bottom email-tags">
                {categories.map((category) => (
                  <SidebarCategory
                    key={category.name}
                    category={category}
                    isActive={activeCategory === category.name}
                    onClick={() => dispatch(setActiveCategory(category.name))}
                  />
                ))}
                {showMoreCategories &&
                  moreCategories.map((category) => (
                    <SidebarCategory
                      key={category.name}
                      category={category}
                      isActive={activeCategory === category.name}
                      onClick={() => dispatch(setActiveCategory(category.name))}
                    />
                  ))}
                <div className="view-all mt-2">
                  <a
                    href="javascript:void(0);"
                    className="viewall-button fw-medium"
                    onClick={() => setShowMoreCategories(!showMoreCategories)}
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
                <a href="javascript:void(0);">
                  <i className="ti ti-square-rounded-plus-filled text-primary fs-16"></i>
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
                  href="javascript:void(0);"
                  className="viewall-button-2 fw-medium"
                  onClick={() => setShowMoreLabels(!showMoreLabels)}
                >
                  <span>{showMoreLabels ? "Show Less" : "Show More"}</span>
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
                <a href="javascript:void(0);">
                  <i className="ti ti-square-rounded-plus-filled text-primary fs-16"></i>
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
                  href="javascript:void(0);"
                  className="viewall-button-3 fw-medium"
                  onClick={() => setShowMoreFolders(!showMoreFolders)}
                >
                  <span>{showMoreFolders ? "Show Less" : "Show More"}</span>
                  <i
                    className={`fa fa-chevron-${
                      showMoreFolders ? "up" : "down"
                    } fs-10 ms-2`}
                  ></i>
                </a>
              </div>
            </div>
            {/* Upgrade Section */}
            <div className="bg-dark rounded text-center position-relative p-4">
              <span className="avatar avatar-lg rounded-circle bg-white mb-2">
                <i className="ti ti-alert-triangle text-dark"></i>
              </span>
              <h6 className="text-white mb-3">
                Enjoy Unlimited Access on a small price monthly.
              </h6>
              <a
                href="javascript:void(0);"
                className="btn btn-white position-relative justify-content-center z-1"
              >
                Upgrade Now <i className="ti ti-arrow-right"></i>
              </a>
              <div className="box-bg">
                <span className="bg-right">
                  <img src="assets/img/bg/email-bg-01.png" alt="Img" />
                </span>
                <span className="bg-left">
                  <img src="assets/img/bg/email-bg-02.png" alt="Img" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailSidebar;
