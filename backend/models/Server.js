const mongoose = require("mongoose");
const serverSchema = new mongoose.Schema(
  {
    CID: {
      type: Number,
      required: true,
      unique: true,
      index: true,
      description: "Unique number ID for server",
    },
    CUID: {
      type: Number,
      required: true,
      index: true,
      description: "Unique number ID for customer",
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
      description: "Name of the customer/organization",
    },
    name: {
      type: String,
      required: true,
      trim: true,
      description: "Server name as per CMDB",
    },
    hostname: {
      type: String,
      required: true,
      trim: true,
      description: "Display name of server",
    },
    ip: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          // Simple IP validation regex (IPv4)
          return /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid IP address!`,
      },
      description: "IP address of the server",
    },
    serverGroup: {
      type: String,
      required: true,
      trim: true,
      description: "Group/category the server belongs to",
    },
    osType: {
      type: String,
      required: true,
    },
    mDBA: {
      type: String,
      required: true,
      enum: ["Yes", "No"],
      description: "Managed DBA status",
    },
    customerMailID: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v) {
          // Simple email validation regex
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: (props) => `${props.value} is not a valid email address!`,
      },
      description: "Customer contact email",
    },
    createdAt: {
      type: Date,
      default: Date.now,
      description: "Timestamp when the record was created",
    },
    updatedAt: {
      type: Date,
      default: Date.now,
      description: "Timestamp when the record was last updated",
    },
  },
  {
    timestamps: true, // This will automatically manage createdAt and updatedAt
    collection: "servers", // Explicit collection name
  }
);

// Add compound indexes for frequently queried fields
serverSchema.index({ CUID: 1, CID: 1 });
serverSchema.index({ hostname: 1, ip: 1 });

module.exports = mongoose.model("Server", serverSchema);
