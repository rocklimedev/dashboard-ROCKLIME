// Run: npm install bcrypt
const bcrypt = require("bcrypt");

const hash = "$2b$10$5u3wo4AnBbPpwMYjNAg3sux3.TUOhlp3iYp0wkp/SCSvRUPnlVgjC";
const candidate = "testpassword"; // replace with what you think it is

bcrypt.compare(candidate, hash).then((match) => {
  if (match) {
    console.log("✅ Password matches");
  } else {
    console.log("❌ No match");
  }
});
