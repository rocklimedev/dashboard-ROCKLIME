const bcrypt = require("bcryptjs");

const storedHash =
  "$2b$10$lMYcK.pxcLvXwgishy.33urquQu2zo5BoY5uJ/r8QVh3tUCnLHIbq"; // User's stored password
const plainPassword = "dv@0912002"; // Replace with actual password

bcrypt.compare(plainPassword, storedHash, (err, result) => {
  console.log(result ? "Password matches!" : "Password mismatch!");
});
