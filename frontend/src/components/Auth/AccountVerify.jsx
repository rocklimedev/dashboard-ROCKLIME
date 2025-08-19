import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useVerifyAccountMutation } from "../../api/authApi";
import { toast } from "sonner";
import logo from "../../assets/img/logo.png";
import { Spinner } from "react-bootstrap"; // Assuming you're using react-bootstrap for the spinner

const AccountVerify = () => {
  const navigate = useNavigate();
  const { token } = useParams(); // Extract token from URL
  const [verifyAccount, { isLoading }] = useVerifyAccountMutation();

  useEffect(() => {
    const verifyToken = async () => {
      // Basic token validation (e.g., check if token exists and is a string)
      if (!token || typeof token !== "string" || token.trim() === "") {
        toast.error("Invalid verification link.");
        setTimeout(() => navigate("/login"), 2000); // Delay redirect for toast visibility
        return;
      }

      try {
        const response = await verifyAccount({ token }).unwrap();
        toast.success(response.message || "Account verified successfully!");
        setTimeout(() => navigate("/login"), 2000); // Delay redirect for toast visibility
      } catch (error) {
        toast.error(error?.data?.message || "Failed to verify account.");
        setTimeout(() => navigate("/login"), 2000); // Delay redirect for toast visibility
      }
    };

    verifyToken();
  }, [token, verifyAccount, navigate]);

  return (
    <div className="main-wrapper">
      <div className="account-content">
        <div className="login-wrapper login-new">
          <div className="row w-100">
            <div className="col-lg-5 mx-auto">
              <div className="login-content user-login">
                <div className="login-logo">
                  <img src={logo} alt="CM Trading Co Logo" />
                </div>
                <div className="card">
                  <div className="card-body p-5 text-center">
                    <div className="login-userheading">
                      <h3>Account Verification</h3>
                      <h4>
                        {isLoading
                          ? "Verifying your account..."
                          : "Processing your verification link"}
                      </h4>
                    </div>
                    <div className="form-login">
                      <button
                        className="btn btn-login"
                        disabled={isLoading}
                        onClick={() => navigate("/login")}
                      >
                        {isLoading ? (
                          <>
                            <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              role="status"
                              aria-hidden="true"
                              className="me-2"
                            />
                            Verifying...
                          </>
                        ) : (
                          "Go to Login"
                        )}
                      </button>
                    </div>
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

export default AccountVerify;
