import React from "react";
import EmailSidebar from "./EmailSidebar";
import EmailList from "./EmailList";

const EmailInterface = () => {
  return (
    <div className="page-wrapper">
      <div className="content p-0">
        <div className="d-md-flex">
          <EmailSidebar />
          <EmailList />
        </div>
      </div>
    </div>
  );
};

export default EmailInterface;
