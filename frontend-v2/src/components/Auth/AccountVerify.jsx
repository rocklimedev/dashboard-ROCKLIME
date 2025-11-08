import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useVerifyAccountMutation } from "../../api/authApi";
import { toast } from "sonner";
import logo from "../../assets/img/logo.png";

const AccountVerify = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const [verifyAccount] = useVerifyAccountMutation();

  useEffect(() => {
    const verifyToken = async () => {
      if (!token || typeof token !== "string" || token.trim() === "") {
        toast.error("Invalid verification link.");
        setTimeout(() => navigate("/login"), 2000);
        return;
      }

      try {
        await verifyAccount({ token }).unwrap();
        toast.success("Account verified successfully!");
        setTimeout(() => navigate("/login"), 2000);
      } catch (error) {
        const message = error?.data?.message || "Failed to verify account.";
        toast.error(message);
        setTimeout(() => navigate("/login"), 2000);
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
                      <h4>Please wait while we verify your account...</h4>
                    </div>
                    <div className="form-login mt-4">
                      <button
                        className="btn btn-login"
                        onClick={() => navigate("/login")}
                        style={{ minWidth: "140px" }}
                      >
                        Go to Login
                      </button>
                    </div>
                    <p className="text-muted mt-3">
                      You will be redirected shortly...
                    </p>
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
