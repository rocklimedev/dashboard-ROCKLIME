const {
  bcrypt,
  jwt,
  Op,
  User,
  Role,
  VerificationToken,
  emails,
  ActivityLog,
  logActivity,
  ROLES,
} = require("./auth.helpers");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Allow login regardless of isEmailVerified or status
    const now = Math.floor(Date.now() / 1000);
    const accessToken = jwt.sign(
      {
        userId: user.userId,
        email: user.email,
        roles: user.roles,
        roleId: user.roleId,
        iat: now,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    const refreshToken = jwt.sign(
      {
        userId: user.userId,
        email: user.email,
        roles: user.roles,
        roleId: user.roleId,
      },
      process.env.REFRESH_SECRET,
      { expiresIn: "7d" },
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    logActivity({
      userId: user.userId,

      contextTag: ActivityLog.CONTEXT_TAGS.AUTH,
      subContext: ActivityLog.SUB_CONTEXTS.USER,

      action: "LOGIN_SUCCESS",

      entityId: user.userId,
      entityName: user.name || user.username,

      description: `User "${user.username}" logged in successfully`,

      metadata: {
        email: user.email,
        role: user.roles,
        status: user.status,
      },

      req,
    }).catch(console.error);
    res.status(200).json({
      message: "Login successful",
      accessToken,
      user: {
        userId: user.userId,
        email: user.email,
        username: user.username,
        name: user.name,
        mobileNumber: user.mobileNumber,
        roles: user.roles,
        roleId: user.roleId,
        status: user.status,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Register
exports.register = async (req, res, next) => {
  try {
    const { username, name, email, mobileNumber = null, password } = req.body; // Set default to null
    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({
      where: { [Op.or]: [{ username }, { email: normalizedEmail }] },
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Username or Email already exists" });
    }

    const roleData = await Role.findOne({
      where: { roleName: ROLES.ROLES.Users },
    });
    if (!roleData) {
      return res.status(400).json({ message: "USERS role not found" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      name,
      email: normalizedEmail,
      mobileNumber, // Will be null if not provided
      password: hashedPassword,
      roles: [roleData.roleName],
      roleId: roleData.roleId,
      status: "inactive",
      isEmailVerified: false,
    });

    const verificationToken = jwt.sign(
      { userId: newUser.userId },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    await VerificationToken.create({
      userId: newUser.userId,
      token: verificationToken,
      email: normalizedEmail,
      isVerified: false,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    logActivity({
      userId: newUser.userId,

      contextTag: ActivityLog.CONTEXT_TAGS.AUTH,
      subContext: ActivityLog.SUB_CONTEXTS.USER,

      action: "USER_REGISTERED",

      entityId: newUser.userId,
      entityName: newUser.name || newUser.username,

      description: `New user "${newUser.username}" registered`,

      newValues: {
        userId: newUser.userId,
        username: newUser.username,
        name: newUser.name,
        email: newUser.email,
        mobileNumber: newUser.mobileNumber,
        role: roleData.roleName,
        status: newUser.status,
        isEmailVerified: newUser.isEmailVerified,
      },

      metadata: {
        registrationType: "SELF_REGISTRATION",
        verificationEmailSent: true,
      },

      req,
    }).catch(console.error);
    // Send verification email
    const emailContent = emails.accountVerificationEmail(
      req.headers.host,
      verificationToken,
    );
    // await emails.sendMail(
    //   newUser.email,
    //   emailContent.subject,
    //   emailContent.text,
    //   emailContent.html
    // );

    res.status(201).json({
      message: "User registered successfully. Verification email sent.",
      user: {
        userId: newUser.userId,
        username: newUser.username,
        name: newUser.name,
        email: newUser.email,
        mobileNumber: newUser.mobileNumber,
        roles: newUser.roles,
        roleId: newUser.roleId,
        status: newUser.status,
        createdAt: newUser.createdAt,
        isEmailVerified: newUser.isEmailVerified,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res) => {
  try {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken || !refreshTokens.has(refreshToken)) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    jwt.verify(refreshToken, process.env.REFRESH_SECRET, (err, user) => {
      if (err) return res.status(403).json({ message: "Invalid token" });

      const newAccessToken = jwt.sign(
        { userId: user.userId, roles: user.roles, roleId: user.roleId },
        process.env.JWT_SECRET,
        { expiresIn: "1h" },
      );

      res.status(200).json({ accessToken: newAccessToken });
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * Validate JWT access token
 * GET /auth/validate-token
 *
 * Header:  Authorization: Bearer <access-token>
 *
 * → 200 OK   – token is valid
 * → 401      – token missing / invalid / expired
 */
exports.validateToken = async (req, res) => {
  try {
    // 1. Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // 2. Verify JWT (signature + exp)
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token has expired" });
      }
      return res.status(401).json({ message: "Invalid token" });
    }

    // 3. (Optional) Confirm user still exists & is active
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    if (user.status !== "active") {
      return res.status(401).json({ message: "Account is inactive" });
    }

    // 4. Token is valid → just return 200
    return res.status(200).json({ message: "Token is valid" });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};
