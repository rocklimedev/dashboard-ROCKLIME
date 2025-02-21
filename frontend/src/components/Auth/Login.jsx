import React from "react";

const Login = () => {
  return (
    <div class="main-wrapper login-body">
      <div class="login-wrapper">
        <div class="container">
          <img
            class="img-fluid logo-dark mb-2 logo-color"
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
                <h1>Login</h1>
                <p class="account-subtitle">Access to our dashboard</p>

                <form action="https://kanakku.dreamstechnologies.com/html/template/index.html">
                  <div class="input-block mb-3">
                    <label class="form-control-label">Email Address</label>
                    <input type="email" class="form-control" />
                  </div>
                  <div class="input-block mb-3">
                    <label class="form-control-label">Password</label>
                    <div class="pass-group">
                      <input type="password" class="form-control pass-input" />
                      <span class="fas fa-eye toggle-password"></span>
                    </div>
                  </div>
                  <div class="input-block mb-3">
                    <div class="row">
                      <div class="col-6">
                        <div class="form-check custom-checkbox">
                          <input
                            type="checkbox"
                            class="form-check-input"
                            id="cb1"
                          />
                          <label class="custom-control-label" for="cb1">
                            Remember me
                          </label>
                        </div>
                      </div>
                      <div class="col-6 text-end">
                        <a class="forgot-link" href="forgot-password.html">
                          Forgot Password ?
                        </a>
                      </div>
                    </div>
                  </div>
                  <button class="btn btn-lg  btn-primary w-100" type="submit">
                    Login
                  </button>
                  <div class="login-or">
                    <span class="or-line"></span>
                    <span class="span-or">or</span>
                  </div>

                  <div class="social-login mb-3">
                    <span>Login with</span>
                    <a href="#" class="facebook">
                      <i class="fab fa-facebook-f"></i>
                    </a>
                    <a href="#" class="google">
                      <i class="fab fa-google"></i>
                    </a>
                  </div>

                  <div class="text-center dont-have">
                    Don't have an account yet?{" "}
                    <a href="/signup">Signup</a>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
