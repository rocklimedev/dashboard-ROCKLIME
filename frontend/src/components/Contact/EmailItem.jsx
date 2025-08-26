import React from "react";
import { useDispatch } from "react-redux";
import { toggleEmailSelection } from "../../api/emailSlice";
import {
  useReplyToEmailMutation,
  useDeleteQueryMutation,
} from "../../api/contactApi";
import Avatar from "react-avatar";

const EmailItem = ({ email, onReplyClick }) => {
  const dispatch = useDispatch();
  const [deleteQuery] = useDeleteQueryMutation();
  const [replyToEmail] = useReplyToEmailMutation();

  // Map Contact schema to expected fields
  const query = {
    id: email._id,
    sender: {
      name: `${email.firstName} ${email.lastName || ""}`.trim(),
      email: email.email,
      initials: `${email.firstName[0]}${
        email.lastName ? email.lastName[0] : ""
      }`.toUpperCase(),
    },
    subject: "Contact Query", // Default since Contact schema has no subject
    preview:
      email.message.slice(0, 50) + (email.message.length > 50 ? "..." : ""),
    timestamp: email.createdAt,
    responded: email.responded,
    selected: email.selected || false, // From emailSlice.selectedEmails
  };

  const handleReply = async () => {
    // Trigger reply form in EmailList via onReplyClick
    onReplyClick(query.id);
  };

  const handleDelete = async () => {
    try {
      await deleteQuery(query.id).unwrap();
      alert("Query deleted successfully!");
    } catch (error) {
      alert(
        `Failed to delete query: ${error?.data?.message || "Unknown error"}`
      );
    }
  };

  return (
    <div className="list-group-item border-bottom p-3">
      <div className="d-flex align-items-center mb-2">
        <div className="form-check form-check-md d-flex align-items-center flex-shrink-0 me-2">
          <input
            className="form-check-input"
            type="checkbox"
            checked={query.selected}
            onChange={() => dispatch(toggleEmailSelection(query.id))}
          />
        </div>
        <div className="d-flex align-items-center flex-wrap row-gap-2 flex-fill">
          <a
            href="javascript:void(0);"
            className="avatar avatar-md avatar-rounded me-2"
          >
            <Avatar
              name={query.sender.name}
              initials={query.sender.initials}
              size="40"
              round={true}
              color={Avatar.getRandomColor("sitebase", { brightness: 40 })}
            />
          </a>
          <div className="flex-fill">
            <div className="d-flex align-items-start justify-content-between">
              <div>
                <h6 className="mb-1">
                  <a href="javascript:void(0);">{query.sender.name}</a>
                </h6>
                <span className="fw-semibold">{query.subject}</span>
              </div>
              <div className="d-flex align-items-center">
                <div className="dropdown">
                  <button
                    className="btn btn-icon btn-sm rounded-circle"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i className="ti ti-dots"></i>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end p-3">
                    <li>
                      <a
                        className="dropdown-item rounded-1"
                        href="javascript:void(0);"
                      >
                        Open Query
                      </a>
                    </li>
                    <li>
                      <a
                        className="dropdown-item rounded-1"
                        href="javascript:void(0);"
                        onClick={handleReply}
                      >
                        Reply
                      </a>
                    </li>
                    <li>
                      <a
                        className="dropdown-item rounded-1"
                        href="javascript:void(0);"
                        onClick={handleDelete}
                      >
                        Delete
                      </a>
                    </li>
                  </ul>
                </div>
                <span>
                  <i
                    className={`ti ti-point-filled text-${
                      query.responded ? "success" : "danger"
                    }`}
                  ></i>
                  {new Date(query.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
            <p>{query.preview}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailItem;
