const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: [true, "Customer name is required"],
    trim: true,
    maxlength: [100, "Customer name cannot exceed 100 characters"],
  },
  osType: {
    type: String,
    required: [true, "OS type is required"],
    enum: {
      values: ["Windows", "Unix"],
      message: "OS type must be either Windows or Unix",
    },
  },
  serverGroup: {
    type: String,
    required: [true, "Server group is required"],
    trim: true,
    maxlength: [100, "Server group cannot exceed 100 characters"],
  },
  scheduleStartTime: {
    type: Date,
    required: [true, "Schedule start time is required"],
    validate: [
      {
        validator: function (value) {
          // Check if start time is in the future
          return value > new Date();
        },
        message: "Schedule start time must be in the future",
      },
    ],
  },
  scheduleEndTime: {
    type: Date,
    required: [true, "Schedule end time is required"],
    validate: [
      {
        validator: function (value) {
          // Check if end time is after start time
          return value > this.scheduleStartTime;
        },
        message: "Schedule end time must be after start time",
      },
    ],
  },
  ticketNumber: {
    type: String,
    maxlength: [50, "Ticket number cannot exceed 50 characters"],
    default: "",
  },
  ticketCreationStatus: {
    type: String,
    default: "Pending",
    enum: ["Pending", "Created", "Failed"],
  },
  mailNotificationStatus: {
    type: String,
    default: "Pending",
    enum: ["Pending", "Sent", "Failed"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
EventSchema.pre("save", function (next) {
  this.updatedAt = new Date();

  next();
});

module.exports = mongoose.model("Event", EventSchema);
