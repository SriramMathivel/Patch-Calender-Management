const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Server = require("../models/Server");

// Helper function for error handling
const handleError = (res, error, status = 500) => {
  console.error(error);
  res.status(status).json({
    success: false,
    message: error.message || "An error occurred",
  });
};

// Create a new server
router.post("/", async (req, res) => {
  try {
    // Validate required fields
    const requiredFields = [
      "CID",
      "CUID",
      "customerName",
      "name",
      "hostname",
      "ip",
      "serverGroup",
      "osType",
      "mDBA",
      "customerMailID",
    ];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({
          success: false,
          message: `${field} is required`,
        });
      }
    }

    // Check if server with this CID already exists
    const existingServer = await Server.findOne({ CID: req.body.CID });
    if (existingServer) {
      return res.status(409).json({
        success: false,
        message: "Server with this CID already exists",
      });
    }

    const newServer = new Server(req.body);
    const savedServer = await newServer.save();

    res.status(201).json({
      success: true,
      data: savedServer,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return handleError(res, error, 400);
    }
    handleError(res, error);
  }
});

// Get all servers with optional filtering
router.get("/", async (req, res) => {
  try {
    // Build query based on query parameters
    const query = {};

    if (req.query.CID) query.CID = req.query.CID;
    if (req.query.CUID) query.CUID = req.query.CUID;
    if (req.query.customerName)
      query.customerName = new RegExp(req.query.customerName, "i");
    if (req.query.hostname)
      query.hostname = new RegExp(req.query.hostname, "i");
    if (req.query.ip) query.ip = req.query.ip;
    if (req.query.serverGroup)
      query.serverGroup = new RegExp(req.query.serverGroup, "i");
    if (req.query.osType) query.osType = new RegExp(req.query.osType, "i");
    if (req.query.mDBA) query.mDBA = req.query.mDBA;

    const servers = await Server.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: servers.length,
      data: servers,
    });
  } catch (error) {
    handleError(res, error);
  }
});

// Get a single server by CID
router.get("/:cid", async (req, res) => {
  try {
    const server = await Server.findOne({ CID: req.params.cid });

    if (!server) {
      return res.status(404).json({
        success: false,
        message: "Server not found",
      });
    }

    res.status(200).json({
      success: true,
      data: server,
    });
  } catch (error) {
    handleError(res, error);
  }
});

// Update a server by CID
router.put("/:cid", async (req, res) => {
  try {
    // Don't allow updating CID
    if (req.body.CID && req.body.CID !== parseInt(req.params.cid)) {
      return res.status(400).json({
        success: false,
        message: "CID cannot be modified",
      });
    }

    const updatedServer = await Server.findOneAndUpdate(
      { CID: req.params.cid },
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!updatedServer) {
      return res.status(404).json({
        success: false,
        message: "Server not found",
      });
    }

    res.status(200).json({
      success: true,
      data: updatedServer,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return handleError(res, error, 400);
    }
    handleError(res, error);
  }
});

// Delete a server by CID
router.delete("/:cid", async (req, res) => {
  try {
    const deletedServer = await Server.findOneAndDelete({
      CID: req.params.cid,
    });

    if (!deletedServer) {
      return res.status(404).json({
        success: false,
        message: "Server not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Server deleted successfully",
      data: deletedServer,
    });
  } catch (error) {
    handleError(res, error);
  }
});

module.exports = router;
