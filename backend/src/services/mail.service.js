const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_APP_PASSWORD,
  },
});

/**
 * Send email with error handling
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @returns {Promise<boolean>} - Success status
 */
const sendMail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: `"Ammu Foods" <${process.env.SMTP_EMAIL}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error("Email sending failed:", error);
    // Don't throw - email failure shouldn't break the flow
    return false;
  }
};

/**
 * Send shop request notification to admin
 */
const sendShopRequestNotification = async (shopRequest) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">New Shop Partnership Request</h2>
      <p>A new shop partnership request has been submitted:</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Shop Name:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${shopRequest.shopName}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Owner:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${shopRequest.shopOwnerName}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Contact:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${shopRequest.contactNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Area:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${shopRequest.area}</td>
        </tr>
      </table>
      <p style="margin-top: 20px;">Please review and approve/reject this request from the admin dashboard.</p>
    </div>
  `;

  return sendMail({
    to: process.env.ADMIN_EMAIL || "ammufoods2018@gmail.com",
    subject: "New Shop Partnership Request",
    html,
  });
};

/**
 * Send shop request approval email
 */
const sendShopApprovalEmail = async (userEmail, shopName) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #27ae60;">Shop Partnership Approved! 🎉</h2>
      <p>Congratulations! Your shop partnership request has been approved.</p>
      <p><strong>Shop Name:</strong> ${shopName}</p>
      <p>You can now place daily orders for your shop. Login to your account to get started.</p>
      <p style="margin-top: 20px;">Thank you for partnering with Ammu Foods!</p>
    </div>
  `;

  return sendMail({
    to: userEmail,
    subject: "Shop Partnership Approved - Ammu Foods",
    html,
  });
};

/**
 * Send shop request rejection email
 */
const sendShopRejectionEmail = async (userEmail, shopName, reason) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #e74c3c;">Shop Partnership Request Update</h2>
      <p>Thank you for your interest in partnering with Ammu Foods.</p>
      <p><strong>Shop Name:</strong> ${shopName}</p>
      <p>Unfortunately, we are unable to approve your partnership request at this time.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
      <p style="margin-top: 20px;">You may reapply after 30 days. If you have any questions, please contact us.</p>
    </div>
  `;

  return sendMail({
    to: userEmail,
    subject: "Shop Partnership Request Update - Ammu Foods",
    html,
  });
};

/**
 * Send event request notification to admin
 */
const sendEventRequestNotification = async (eventRequest) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">New Event Order Request</h2>
      <p>A new event order request has been submitted:</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Event:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${eventRequest.eventName}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Contact:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${eventRequest.contactPerson} - ${eventRequest.contactNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Date:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${new Date(eventRequest.eventDate).toLocaleDateString()}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Location:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${eventRequest.eventLocation}</td>
        </tr>
      </table>
      <p style="margin-top: 20px;">Please review this request from the admin dashboard.</p>
    </div>
  `;

  return sendMail({
    to: process.env.ADMIN_EMAIL || "ammufoods2018@gmail.com",
    subject: "New Event Order Request",
    html,
  });
};

/**
 * Send event status update email to user
 */
const sendEventStatusEmail = async (userEmail, eventName, status, adminNotes) => {
  const statusColors = {
    ACCEPTED: "#27ae60",
    REJECTED: "#e74c3c",
    CONTACTED: "#3498db",
    COMPLETED: "#27ae60",
  };

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: ${statusColors[status] || "#2c3e50"};">Event Order Status Update</h2>
      <p>Your event order request has been updated:</p>
      <p><strong>Event:</strong> ${eventName}</p>
      <p><strong>Status:</strong> ${status}</p>
      ${adminNotes ? `<p><strong>Notes:</strong> ${adminNotes}</p>` : ""}
      <p style="margin-top: 20px;">Thank you for choosing Ammu Foods!</p>
    </div>
  `;

  return sendMail({
    to: userEmail,
    subject: `Event Order ${status} - Ammu Foods`,
    html,
  });
};

/**
 * Send daily order notification to admin
 */
const sendDailyOrderNotification = async (order) => {
  const productsHtml = order.products
    .map(
      (p) =>
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${p.productName}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${p.quantity}</td>
        </tr>`
    )
    .join("");

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">New Daily Order Placed</h2>
      <p><strong>Shop:</strong> ${order.shopName}</p>
      <p><strong>Delivery Date:</strong> ${new Date(order.deliveryDate).toLocaleDateString()}</p>
      <p><strong>Total Amount:</strong> ₹${order.totalAmount}</p>
      <h3>Products:</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="background-color: #f8f9fa;">
          <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Product</th>
          <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Quantity</th>
        </tr>
        ${productsHtml}
      </table>
    </div>
  `;

  return sendMail({
    to: process.env.ADMIN_EMAIL || "ammufoods2018@gmail.com",
    subject: "New Daily Order - Ammu Foods",
    html,
  });
};

/**
 * Send order status update email to shop
 */
const sendOrderStatusEmail = async (shopEmail, order, newStatus) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">Order Status Update</h2>
      <p>Your order status has been updated:</p>
      <p><strong>Order ID:</strong> ${order._id}</p>
      <p><strong>Delivery Date:</strong> ${new Date(order.deliveryDate).toLocaleDateString()}</p>
      <p><strong>New Status:</strong> ${newStatus}</p>
      <p style="margin-top: 20px;">Thank you for your business!</p>
    </div>
  `;

  return sendMail({
    to: shopEmail,
    subject: `Order ${newStatus} - Ammu Foods`,
    html,
  });
};

module.exports = {
  sendMail,
  sendShopRequestNotification,
  sendShopApprovalEmail,
  sendShopRejectionEmail,
  sendEventRequestNotification,
  sendEventStatusEmail,
  sendDailyOrderNotification,
  sendOrderStatusEmail,
};
