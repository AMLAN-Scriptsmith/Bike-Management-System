const notifyCustomer = async ({ userId, title, message }) => {
  const notification = {
    toUserId: userId,
    title,
    message,
    sentAt: new Date().toISOString(),
  };

  console.log("[MOCK-NOTIFICATION]", notification);
  return notification;
};

module.exports = {
  notifyCustomer,
};
