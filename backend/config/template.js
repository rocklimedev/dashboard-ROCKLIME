exports.resetEmail = (host, resetToken) => {
  const message = {
    subject: "Reset Password",
    text:
      `${
        "You are receiving this because you have requested to reset your password for your account.\n\n" +
        "Please click on the following link, or paste this into your browser to complete the process.\n\n" +
        "http://"
      }${host}/reset-password/${resetToken}\n\n` +
      `If you did not request this, please ignore this email and your password will remain unchanged.\n`,
  };
  return message;
};

exports.confirmResetPasswordEmail = () => {
  const message = {
    subjext: "Password Changed",
    text:
      `You are receiving this email because you changed your password. \n\n` +
      `If you did not request this change, please contact us immediately.`,
  };
  return message;
};

exports.merchantSignUp = (host, { resetToken, email }) => {
  const message = {
    subject: "Merchant Registration",
    text: `${
      "Congratulations! You application has been acceptedd. Please complete your Merchant account signup by clicking on the link below. \n\n" +
      "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
      "http://"
    }${host}/merchant-signup/${resetToken}?email=${email}\n\n`,
  };
  return message;
};

exports.merchantWelcome = (name) => {
  const message = {
    subject: "Merchant Registration",
    text:
      `Hi ${name}! Congratulations! Your application for merchant account has been accepted. \n\n` +
      `It looks like you already have a member account with us. Please sign in with your member credentials and you will be able to see your merchant account.`,
  };
  return message;
};

exports.signupEmail = (name) => {
  const message = {
    subject: "Account Registration",
    text: `Hi ${name.firstName} ${name.lastName}! Thank you for creating an account with us.`,
  };
  return message;
};

exports.newsletterSubscriptionEmail = () => {
  const message = {
    subject: "Newsletter Subscription",
    text:
      `You are receiving this meial because you subscribes to our newsletter. \n\n` +
      `If you did not request this change, please contact us immediately.`,
  };
  return message;
};

exports.contactEmail = () => {
  const message = {
    subject: "Contact Us",
    text: `We received your message! Our team will contact you soon. \n\n`,
  };

  return message;
};

exports.merchantApplicationEmail = () => {
  const message = {
    subject: "Sell on Time Office",
    text: `We received your request! Our team will contact you soon. \n\n`,
  };

  return message;
};

exports.merchantDeactivateAccount = () => {
  const message = {
    subject: "Merchant account on Time Office",
    text:
      `Your merchant account has been disabled. \n\n` +
      `Please contact admin to request access again.`,
  };

  return message;
};

exports.orderConfirmationEmail = (order) => {
  const message = {
    subject: `Order Confirmation ${order._id}`,
    text:
      `Hi ${order.user.profile.firstName}! Thank you for your order!. \n\n` +
      `We've received your order and will contact you as soon as your package is shipped. \n\n`,
  };

  return message;
};
exports.orderShippedEmail = (order) => {
  const message = {
    subject: `Your Order ${order._id} Has Been Shipped`,
    text:
      `Hi ${order.user.profile.firstName},\n\n` +
      `Good news! Your order has been shipped and is on its way to you.\n\n` +
      `You can track your shipment here: ${order.shippingTrackingUrl}\n\n` +
      `Thank you for shopping with us! If you have any questions, feel free to reach out.\n\n`,
  };
  return message;
};
exports.orderDeliveredEmail = (order) => {
  const message = {
    subject: `Your Order ${order._id} Has Been Delivered`,
    text:
      `Hi ${order.user.profile.firstName},\n\n` +
      `We're excited to let you know that your order has been delivered!\n\n` +
      `If you're satisfied with your purchase, please consider leaving a review.\n\n` +
      `Thank you for shopping with us. We hope to serve you again soon!\n\n`,
  };
  return message;
};
exports.orderCanceledEmail = (order) => {
  const message = {
    subject: `Your Order ${order._id} Has Been Canceled`,
    text:
      `Hi ${order.user.profile.firstName},\n\n` +
      `We're sorry to inform you that your order has been canceled due to an issue with payment or availability.\n\n` +
      `If you have any questions or would like to reorder, please contact our support team.\n\n` +
      `We apologize for any inconvenience caused.\n\n`,
  };
  return message;
};
exports.productBackInStockEmail = (product, user) => {
  const message = {
    subject: `${product.name} is Back in Stock!`,
    text:
      `Hi ${user.profile.firstName},\n\n` +
      `We're excited to let you know that the product you wanted, ${product.name}, is now back in stock!\n\n` +
      `Hurry, limited quantities are available. You can purchase it here: ${product.url}\n\n` +
      `Thanks for your patience!\n\n`,
  };
  return message;
};
exports.passwordResetRequestEmail = (host, resetToken) => {
  const message = {
    subject: "Password Reset Request",
    text:
      `Hi, \n\n` +
      `You requested a password reset. Please click on the following link to reset your password:\n\n` +
      `http://${host}/reset-password/${resetToken}\n\n` +
      `If you did not request this, please ignore this email.\n\n`,
  };
  return message;
};
exports.paymentFailedEmail = (order) => {
  const message = {
    subject: `Payment Failed for Order ${order._id}`,
    text:
      `Hi ${order.user.profile.firstName},\n\n` +
      `We were unable to process your payment for the order ${order._id}. Please check your payment details and try again.\n\n` +
      `If the issue persists, please contact our support team for assistance.\n\n` +
      `Thank you!\n\n`,
  };
  return message;
};
exports.accountVerificationEmail = (host, verificationToken) => {
  const message = {
    subject: "Account Verification",
    text:
      `Hi,\n\n` +
      `Thank you for registering with us. To verify your account, please click the following link:\n\n` +
      `http://${host}/verify-account/${verificationToken}\n\n` +
      `If you did not register, please ignore this email.\n\n`,
  };
  return message;
};
exports.reviewRequestEmail = (order) => {
  const message = {
    subject: `We'd Love Your Feedback on Order ${order._id}`,
    text:
      `Hi ${order.user.profile.firstName},\n\n` +
      `We hope you're enjoying your recent purchase from us. We'd love to hear your thoughts!\n\n` +
      `Please leave a review for the product(s) you purchased:\n\n` +
      `${order.productNames}\n\n` +
      `Your feedback helps us improve and helps other customers make informed decisions. Thank you!`,
  };
  return message;
};
exports.subscriptionRenewalReminderEmail = (user) => {
  const message = {
    subject: "Subscription Renewal Reminder",
    text:
      `Hi ${user.profile.firstName},\n\n` +
      `This is a reminder that your subscription plan will be renewed soon. Please ensure your payment details are up to date.\n\n` +
      `If you have any questions or want to modify your plan, feel free to contact us.\n\n`,
  };
  return message;
};
exports.accountDeactivationWarningEmail = (user) => {
  const message = {
    subject: "Account Deactivation Warning",
    text:
      `Hi ${user.profile.firstName},\n\n` +
      `We noticed that your account has been inactive for a while. If you wish to keep it, please log in within the next 7 days to avoid deactivation.\n\n` +
      `If you need assistance, feel free to contact us.\n\n`,
  };
  return message;
};
exports.cartAbandonmentReminderEmail = (user, cart) => {
  const message = {
    subject: "You Left Something in Your Cart!",
    text:
      `Hi ${user.profile.firstName},\n\n` +
      `It looks like you left some items in your cart. Don't miss out on them! Here's what you left behind:\n\n` +
      `${cart.items
        .map((item) => `${item.name} - ${item.quantity} x $${item.price}`)
        .join("\n")}\n\n` +
      `Complete your purchase now: ${cart.url}\n\n` +
      `If you have any questions, our team is here to help.\n\n`,
  };
  return message;
};
