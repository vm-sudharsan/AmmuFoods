const EventRequest = require("../models/EventRequest.model");
const { User } = require("../models/User.model");
const { createNotification } = require("../services/notification.service");
const { sendMail } = require("../services/mail.service");

// USER / SHOP: Submit event request
const createEventRequest = async (req, res) => {
  try {
    const {
      eventName,
      contactPerson,
      contactNumber,
      eventLocation,
      itemsRequired,
      approxQuantity,
      eventDate,
      deliveryTime,
      guestCount,
      notes
    } = req.body;

    // Map frontend fields to model schema
    const event = await EventRequest.create({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      eventName,
      contactPerson,
      contactNumber,
      secondaryContact: req.body.secondaryContact, // Optional
      eventLocation,
      eventDate,
      eventTime: req.body.eventTime || '00:00', // Default if not provided
      deliveryTime,
      guestCount: guestCount || null,
      products: [], // Will be filled later by admin or can be parsed from itemsRequired
      specialInstructions: `${itemsRequired ? 'Items: ' + itemsRequired : ''}${approxQuantity ? ' | Quantity: ' + approxQuantity : ''}${notes ? ' | Notes: ' + notes : ''}`.trim(),
    });

    // Notify admin (in-app)
    try {
      const admins = await User.find({ role: "ADMIN", isActive: true });
      
      for (const admin of admins) {
        await createNotification(
          admin._id,
          "EVENT",
          `New event request from ${req.user.email}`,
          "MEDIUM",
          {
            eventName: event.eventName,
            eventDate: event.eventDate,
            requestId: event._id
          }
        );
      }
    } catch (notifError) {
      console.error("Failed to create notification:", notifError);
    }

    // Notify admin (email)
    try {
      await sendMail({
        to: process.env.ADMIN_EMAIL || process.env.SMTP_EMAIL,
        subject: "New Event Order Request - Ammu Foods",
        html: `
          <h2>New Event Order Request</h2>
          <p><strong>Event Name:</strong> ${event.eventName}</p>
          <p><strong>Customer:</strong> ${req.user.name} (${req.user.email})</p>
          <p><strong>Event Date:</strong> ${new Date(event.eventDate).toLocaleDateString()}</p>
          <p><strong>Location:</strong> ${event.eventLocation}</p>
          <p><strong>Contact:</strong> ${event.contactPerson} - ${event.contactNumber}</p>
          ${guestCount ? `<p><strong>Guest Count:</strong> ${guestCount}</p>` : ''}
          ${event.specialInstructions ? `<p><strong>Details:</strong> ${event.specialInstructions}</p>` : ''}
          <p>Please review this request in the admin dashboard.</p>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send email notification:", emailError);
    }

    // Send confirmation email to user
    try {
      await sendMail({
        to: req.user.email,
        subject: "Event Order Request Received - Ammu Foods",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #d32f2f;">Event Order Request Received</h2>
            <p>Dear ${req.user.name},</p>
            <p>Thank you for choosing <strong>Ammu Foods</strong> for your special event!</p>
            <p>We have received your event order request with the following details:</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Event Name:</strong> ${event.eventName}</p>
              <p><strong>Event Date:</strong> ${new Date(event.eventDate).toLocaleDateString()}</p>
              <p><strong>Location:</strong> ${event.eventLocation}</p>
              <p><strong>Contact Person:</strong> ${event.contactPerson}</p>
              <p><strong>Contact Number:</strong> ${event.contactNumber}</p>
              ${guestCount ? `<p><strong>Guest Count:</strong> ${guestCount}</p>` : ''}
              ${event.specialInstructions ? `<p><strong>Special Instructions:</strong> ${event.specialInstructions}</p>` : ''}
            </div>
            <p>Our team will review your request and contact you within 1-2 business days to discuss the details and finalize your order.</p>
            <p>You can track your order status by logging into your account.</p>
            <p style="margin-top: 30px;">Thank you for choosing Ammu Foods!<br><strong>Ammu Foods Team</strong></p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send confirmation email to user:", emailError);
    }

    res.status(201).json({
      message: "Event request submitted successfully",
      event,
    });
  } catch (error) {
    console.error("Error creating event request:", error);
    res.status(500).json({
      message: "Failed to submit event request",
      error: error.message,
    });
  }
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
  try {
    const { status, adminNotes } = req.body;

    const validStatuses = ["NEW", "CONTACTED", "ACCEPTED", "MANUFACTURING", "PACKING", "OUT_FOR_DELIVERY", "COMPLETED", "REJECTED"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const event = await EventRequest.findById(req.params.id).populate('userId');
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const oldStatus = event.status;

    // Update status
    event.status = status;

    // Add to status history with notes
    event.statusHistory.push({
      status,
      timestamp: new Date(),
      updatedBy: req.user._id,
      notes: adminNotes || `Status changed from ${oldStatus} to ${status}`,
    });

    // Append to admin notes if provided
    if (adminNotes) {
      const timestamp = new Date().toLocaleString();
      const noteEntry = `[${timestamp}] ${adminNotes}`;
      event.adminNotes = event.adminNotes 
        ? `${event.adminNotes}\n${noteEntry}` 
        : noteEntry;
    }

    await event.save();

    // Create in-app notification for user
    try {
      const { createNotification } = require('../services/notification.service');
      
      const statusMessages = {
        'CONTACTED': 'Our team has contacted you regarding your event order.',
        'ACCEPTED': 'Great news! Your event order has been accepted and confirmed.',
        'MANUFACTURING': 'We\'ve started preparing your event order!',
        'PACKING': 'Your event order is being carefully packed.',
        'OUT_FOR_DELIVERY': 'Your event order is out for delivery!',
        'COMPLETED': 'Your event order has been successfully delivered.',
        'REJECTED': 'We regret that we cannot fulfill your event order at this time.'
      };

      const message = statusMessages[status] || `Your event order status has been updated to ${status}`;
      const priority = status === 'REJECTED' ? 'HIGH' : status === 'COMPLETED' ? 'HIGH' : 'MEDIUM';

      await createNotification(
        event.userId._id,
        "EVENT",
        message,
        priority,
        {
          eventName: event.eventName,
          eventId: event._id,
          status: status,
          eventDate: event.eventDate
        }
      );
    } catch (notifError) {
      console.error("Failed to create notification:", notifError);
    }

    // Send email notification to user based on status
    try {
      const statusMessages = {
        'CONTACTED': {
          subject: 'We\'ve Contacted You - Event Order Update',
          message: 'Our team has reached out to you regarding your event order. Please check your phone for our call or message.',
          color: '#f59e0b'
        },
        'ACCEPTED': {
          subject: 'Order Accepted - Event Order Update',
          message: 'Great news! Your event order has been accepted and confirmed. We\'re preparing everything for your special day.',
          color: '#10b981'
        },
        'MANUFACTURING': {
          subject: 'Preparation Started - Event Order Update',
          message: 'We\'ve started preparing your order! Our team is working hard to make everything perfect for your event.',
          color: '#8b5cf6'
        },
        'PACKING': {
          subject: 'Packing in Progress - Event Order Update',
          message: 'Your order is being carefully packed and will be ready for delivery soon.',
          color: '#f97316'
        },
        'OUT_FOR_DELIVERY': {
          subject: 'Out for Delivery - Event Order Update',
          message: 'Your order is on its way! Our delivery team will reach you at the scheduled time.',
          color: '#3b82f6'
        },
        'COMPLETED': {
          subject: 'Order Delivered - Thank You!',
          message: 'Your order has been successfully delivered. We hope your event is a grand success! Thank you for choosing Ammu Foods.',
          color: '#059669'
        },
        'REJECTED': {
          subject: 'Order Status Update',
          message: 'We regret to inform you that we are unable to fulfill your event order at this time. Please contact us for more details.',
          color: '#dc2626'
        }
      };

      const statusInfo = statusMessages[status];
      if (statusInfo && event.userId) {
        await sendMail({
          to: event.userId.email,
          subject: `${statusInfo.subject} - Ammu Foods`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: ${statusInfo.color}; color: white; padding: 20px; text-align: center;">
                <h2 style="margin: 0;">Event Order Status Update</h2>
              </div>
              <div style="padding: 20px; background-color: #f9fafb;">
                <p>Dear ${event.userId.name},</p>
                <p>${statusInfo.message}</p>
                <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${statusInfo.color};">
                  <h3 style="margin-top: 0; color: ${statusInfo.color};">Order Details</h3>
                  <p><strong>Event Name:</strong> ${event.eventName}</p>
                  <p><strong>Event Date:</strong> ${new Date(event.eventDate).toLocaleDateString()}</p>
                  <p><strong>Location:</strong> ${event.eventLocation}</p>
                  <p><strong>Current Status:</strong> <span style="color: ${statusInfo.color}; font-weight: bold;">${status.replace('_', ' ')}</span></p>
                </div>
                ${adminNotes ? `<div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <p style="margin: 0;"><strong>Note from Admin:</strong></p>
                  <p style="margin: 10px 0 0 0;">${adminNotes}</p>
                </div>` : ''}
                <p>You can track your order status anytime by logging into your account.</p>
                <p>If you have any questions, please don't hesitate to contact us.</p>
                <p>Best regards,<br>Ammu Foods Team</p>
              </div>
            </div>
          `,
        });
      }
    } catch (emailError) {
      console.error("Failed to send status update email:", emailError);
    }

    res.json({ message: "Event status updated", event });
  } catch (error) {
    console.error("Error updating event status:", error);
    res.status(500).json({ message: "Failed to update event status" });
  }
};

// ADMIN: Update event details
const updateEventDetails = async (req, res) => {
  try {
    const event = await EventRequest.findById(req.params.id).populate('userId', 'email name');
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const changes = [];
    const {
      eventName,
      contactPerson,
      contactNumber,
      secondaryContact,
      eventLocation,
      eventDate,
      eventTime,
      deliveryTime,
      guestCount,
      specialInstructions,
    } = req.body;

    // Track changes
    if (eventName && eventName !== event.eventName) {
      changes.push(`Event Name: "${event.eventName}" → "${eventName}"`);
      event.eventName = eventName;
    }
    if (contactPerson && contactPerson !== event.contactPerson) {
      changes.push(`Contact Person: "${event.contactPerson}" → "${contactPerson}"`);
      event.contactPerson = contactPerson;
    }
    if (contactNumber && contactNumber !== event.contactNumber) {
      changes.push(`Contact Number: "${event.contactNumber}" → "${contactNumber}"`);
      event.contactNumber = contactNumber;
    }
    if (secondaryContact !== undefined && secondaryContact !== event.secondaryContact) {
      changes.push(`Secondary Contact: "${event.secondaryContact || 'None'}" → "${secondaryContact || 'None'}"`);
      event.secondaryContact = secondaryContact;
    }
    if (eventLocation && eventLocation !== event.eventLocation) {
      changes.push(`Location: "${event.eventLocation}" → "${eventLocation}"`);
      event.eventLocation = eventLocation;
    }
    if (eventDate && new Date(eventDate).getTime() !== new Date(event.eventDate).getTime()) {
      changes.push(`Event Date: "${new Date(event.eventDate).toLocaleDateString()}" → "${new Date(eventDate).toLocaleDateString()}"`);
      event.eventDate = eventDate;
    }
    if (eventTime && eventTime !== event.eventTime) {
      changes.push(`Event Time: "${event.eventTime}" → "${eventTime}"`);
      event.eventTime = eventTime;
    }
    if (deliveryTime && deliveryTime !== event.deliveryTime) {
      changes.push(`Delivery Time: "${event.deliveryTime}" → "${deliveryTime}"`);
      event.deliveryTime = deliveryTime;
    }
    if (guestCount !== undefined && guestCount !== event.guestCount) {
      changes.push(`Guest Count: "${event.guestCount || 'Not specified'}" → "${guestCount}"`);
      event.guestCount = guestCount;
    }
    if (specialInstructions !== undefined && specialInstructions !== event.specialInstructions) {
      changes.push(`Special Instructions updated`);
      event.specialInstructions = specialInstructions;
    }

    if (changes.length > 0) {
      // Add to status history
      event.statusHistory.push({
        status: event.status,
        timestamp: new Date(),
        updatedBy: req.user._id,
        notes: `Order edited: ${changes.join('; ')}`,
      });

      // Add to admin notes
      const timestamp = new Date().toLocaleString();
      const noteEntry = `[${timestamp}] Order edited by admin:\n${changes.join('\n')}`;
      event.adminNotes = event.adminNotes 
        ? `${event.adminNotes}\n${noteEntry}` 
        : noteEntry;

      // Send email notification to user
      try {
        const mailService = require('../services/mail.service');
        await mailService.sendMail({
          to: event.userId.email,
          subject: `Event Order Updated - ${event.eventName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #dc2626;">Event Order Updated</h2>
              <p>Dear ${event.userId.name},</p>
              <p>Your event order has been updated by our admin team. Here are the changes:</p>
              
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #374151;">Event Details:</h3>
                <p><strong>Event Name:</strong> ${event.eventName}</p>
                <p><strong>Event Date:</strong> ${new Date(event.eventDate).toLocaleDateString()}</p>
                <p><strong>Location:</strong> ${event.eventLocation}</p>
                <p><strong>Delivery Time:</strong> ${event.deliveryTime}</p>
                ${event.guestCount ? `<p><strong>Guest Count:</strong> ${event.guestCount}</p>` : ''}
              </div>

              <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #92400e;">Changes Made:</h3>
                ${changes.map(change => `<p style="margin: 5px 0;">• ${change}</p>`).join('')}
              </div>

              ${event.specialInstructions ? `
                <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #374151;">Special Instructions:</h3>
                  <p>${event.specialInstructions}</p>
                </div>
              ` : ''}

              <p>If you have any questions about these changes, please contact us.</p>
              
              <p style="margin-top: 30px;">
                Best regards,<br>
                <strong>Ammu Foods Team</strong>
              </p>
            </div>
          `
        });
        console.log('Edit notification email sent successfully to:', event.userId.email);
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't fail the request if email fails
      }
    }

    await event.save();

    res.json({ message: "Event updated successfully", event });
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ message: "Failed to update event" });
  }
};

// ADMIN: Add note to event
const addEventNote = async (req, res) => {
  try {
    const { note } = req.body;
    
    if (!note || !note.trim()) {
      return res.status(400).json({ message: "Note cannot be empty" });
    }

    const event = await EventRequest.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const timestamp = new Date().toLocaleString();
    const noteEntry = `[${timestamp}] ${note}`;
    
    event.adminNotes = event.adminNotes 
      ? `${event.adminNotes}\n${noteEntry}` 
      : noteEntry;

    // Also add to status history
    event.statusHistory.push({
      status: event.status,
      timestamp: new Date(),
      updatedBy: req.user._id,
      notes: note,
    });

    await event.save();

    res.json({ message: "Note added successfully", event });
  } catch (error) {
    console.error("Error adding note:", error);
    res.status(500).json({ message: "Failed to add note" });
  }
};

// USER: Get my event requests
const getUserEvents = async (req, res) => {
  const events = await EventRequest.find({ userId: req.user._id }).sort({
    createdAt: -1,
  });
  res.json({ events });
};

// ADMIN: Get single event by ID
getEventById = async (req, res) => {
  try {
    const event = await EventRequest.findById(req.params.id)
      .populate("userId", "email name role")
      .lean();

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Transform userId to userName and userEmail for frontend compatibility
    if (event.userId) {
      event.userName = event.userId.name;
      event.userEmail = event.userId.email;
    }

    res.json({ event });
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({ message: "Failed to fetch event" });
  }
}

module.exports = {
  createEventRequest,
  getAllEventRequests,
  getEventById,
  updateEventStatus,
  updateEventDetails,
  addEventNote,
  getUserEvents,
};
