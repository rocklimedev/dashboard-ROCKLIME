require('dotenv').config();

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not set. Add it to backend/.env (see .env.example).');
}

module.exports = {
  app: {
    name: 'CM ERP Backend',
    apiURL: `${process.env.BASE_API_URL}`,
    clientURL: require('./clientUrl')(),
  },
  port: process.env.PORT || 4000,
  jwt: {
    secret: process.env.JWT_SECRET,
    // Access tokens are short-lived; the auth middleware also re-checks the user's status on every request.
    tokenLife: process.env.JWT_TOKEN_LIFE || '12h',
  },
  mailchimp: {
    key: process.env.MAILCHIMP_KEY,
    listKey: process.env.MAILCHIMP_LIST_KEY,
  },
  mailgun: {
    key: process.env.MAILGUN_KEY,
    domain: process.env.MAILGUN_DOMAIN,
    sender: process.env.MAILGUN_EMAIL_SENDER,
  },
};
