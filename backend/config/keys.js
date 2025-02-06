module.exports = {
  app: {
    name: "NayaVyapaar Backend",
    apiURL: `${process.env.BASE_API_URL}`,
    clientURL: process.env.CLIENT_URL || "http://localhost:3000",
  },
  port: process.env.PORT || 4000,
  jwt: {
    secret:
      process.env.JWT_SECRET ||
      "aed2f6f2571272a9be88dceeb40d10da839ba5be58dc71356a4f58e666df6ddf31994cd47ef17fbae6a318b76e7e24a5bf15f4b5fae76123aee2b25f8048fbae1380c3fecc52bfefea1c7592563e65a5c9233d0faabfa2e7f185d7ff91adca4160ff907d30b978b199aee5c77edeec343a8d4df4a403e3fdebc1866efb741634739e4486ed917e10d5be5a8f789a894627cbf4a9fda9f4271463a19994ff233fa58d48675bda461403c70eeffa38cf19a180f0c65a9b5e1cbd1cbee9ab695fd6818978663126d4e4d92ab89d4243e26382b064f10c98b69604d1a5bcc6e86b7d5e97c754b3c32a7c0a9167e8cc5d1b1a096815d52423348255d4a097ad3366d0", // Provide a fallback secret
    tokenLife: "7d",
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
