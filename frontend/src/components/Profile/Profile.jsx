import React from "react";
import { useGetProfileQuery } from "../../api/userApi";
const Profile = () => {
  const { data: profile, isLoading, error } = useGetProfileQuery();

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error loading profile</p>;

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="card">
          <div className="card-header">
            <h4>Profile</h4>
          </div>
          <div className="card-body profile-body">
            <h5 className="mb-2">
              <i className="ti ti-user text-primary me-1"></i>Basic Information
            </h5>
            <div className="profile-pic-upload image-field">
              <div className="profile-pic p-2">
                <img
                  src="assets/img/users/user-49.png"
                  className="object-fit-cover h-100 rounded-1"
                  alt="user"
                />
              </div>
            </div>
            <div className="row">
              <div className="col-lg-6 col-sm-12">
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <p className="form-control-static">
                    {profile?.user?.name || "N/A"}
                  </p>
                </div>
              </div>
              <div className="col-lg-6 col-sm-12">
                <div className="mb-3">
                  <label>Email</label>
                  <p className="form-control-static">
                    {profile?.user?.email || "N/A"}
                  </p>
                </div>
              </div>
              <div className="col-lg-6 col-sm-12">
                <div className="mb-3">
                  <label className="form-label">Phone Number</label>
                  <p className="form-control-static">
                    {profile?.user?.mobileNumber || "N/A"}
                  </p>
                </div>
              </div>
              <div className="col-lg-6 col-sm-12">
                <div className="mb-3">
                  <label className="form-label">Status</label>
                  <p className="form-control-static">
                    {profile?.user?.status || "N/A"}
                  </p>
                </div>
              </div>
              <div className="col-12 d-flex justify-content-end">
                <a
                  href="javascript:void(0);"
                  className="btn btn-primary shadow-none"
                >
                  Edit Profile
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
