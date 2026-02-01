const EventRequest = require("../models/EventRequest.model");
const { createNotification } = require("../services/notification.service");
const { sendMail } = require("../services/mail.service");

// USER / SHOP: Submit event request
const createEventRequest = async (req, res) => {
  const event = await EventRequest.create({
    userId: req.user._id,
    ...req.body,
  });

  // Notify admin (in-app)
  await createNotification({
    targetRole: "ADMIN",
    message: `New event request from ${req.user.email}`,
    priority: "MEDIUM",
  });

  // Notify admin (email)
  await sendMail({
    to: process.env.SMTP_EMAIL,
    subject: "New Event Order Request",
    html: `<p>New event order received from <b>${req.user.email}</b></p>`,
  });

  res.status(201).json({
    message: "Event request submitted",
    event,
  });
};

// ADMIN: View all event requests
const getAllEventRequests = async (req, res) => {
  const events = await EventRequest.find()
    .populate("userId", "email name role")
    .sort({ createdAt: -1 });

  res.json({ events });
};

// ADMIN: Update event status
const updateEventStatus = async (req, res) => {
  const { status } = req.body;

  const event = await EventRequest.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );

  res.json({ message: "Event status updated", event });
};

// USER: Get my event requests
const getUserEvents = async (req, res) => {
  const events = await EventRequest.find({ userId: req.user._id }).sort({
    createdAt: -1,
  });
  res.json({ events });
};

module.exports = {
  createEventRequest,
  getAllEventRequests,
  updateEventStatus,
  getUserEvents,
};
