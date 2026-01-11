const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_APP_PASSWORD,
  },
});

const sendMail = async ({ to, subject, html }) => {
  return transporter.sendMail({
    from: `"Ammu Foods" <${process.env.SMTP_EMAIL}>`,
    to,
    subject,
    html,
  });
};

module.exports = { sendMail };
