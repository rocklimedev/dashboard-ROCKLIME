import React from "react";

const Signup = () => {
  return (
    <div class="main-wrapper login-body">
      <div class="login-wrapper">
        <div class="container">
          <img
            class="img-fluid logo-dark mb-2"
            src="assets/img/logo2.png"
            alt="Logo"
          />
          <img
            class="img-fluid logo-light mb-2"
            src="assets/img/logo2-white.png"
            alt="Logo"
          />

          <div class="loginbox">
            <div class="login-right">
              <div class="login-right-wrap">
                <h1>Register</h1>
                <p class="account-subtitle">Access to our dashboard</p>

                <form action="https://kanakku.dreamstechnologies.com/html/template/login.html">
                  <div class="input-block mb-3">
                    <label class="form-control-label">Name</label>
                    <input class="form-control" type="text" />
                  </div>
                  <div class="input-block mb-3">
                    <label class="form-control-label">Email Address</label>
                    <input class="form-control" type="text" />
                  </div>
                  <div class="input-block mb-3">
                    <label class="form-control-label">Password</label>
                    <input class="form-control" type="text" />
                  </div>
                  <div class="input-block mb-3">
                    <label class="form-control-label">Confirm Password</label>
                    <input class="form-control" type="text" />
                  </div>
                  <div class="input-block mb-0">
                    <button class="btn btn-lg  btn-primary w-100" type="submit">
                      Register
                    </button>
                  </div>
                </form>

                <div class="login-or">
                  <span class="or-line"></span>
                  <span class="span-or">or</span>
                </div>

                <div class="social-login">
                  <span>Register with</span>
                  <a href="#" class="facebook">
                    <i class="fab fa-facebook-f"></i>
                  </a>
                  <a href="#" class="google">
                    <i class="fab fa-google"></i>
                  </a>
                </div>

                <div class="text-center dont-have">
                  Already have an account? <a href="login.html">Login</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
