const express = require("express");
const mongoose = require("mongoose");
const Event = require("../models/Event.js");

const router = express.Router();

// Middleware to validate ObjectId
const validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "Invalid Schedule ID" });
  }
  next();
};

// Apply middleware to routes that use :id
router.use("/:id", validateObjectId);

// GET all events
router.get("/", async (req, res) => {
  try {
    // Fetch all fields except internal ones if needed
    const events = await Event.find({}).sort({ scheduleStartTime: 1 }); // Sort by schedule time

    res.json(events);
  } catch (err) {
    console.error("Error fetching Patch Schedules:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

// POST create new event
router.post("/", async (req, res) => {
  try {
    const newEvent = new Event({
      customerName: req.body.customerName,
      osType: req.body.osType,
      serverGroup: req.body.serverGroup,
      scheduleStartTime: req.body.scheduleStartTime,
      scheduleEndTime: req.body.scheduleEndTime,
      // Status fields will use their defaults
    });

    const savedEvent = await newEvent.save();
    res.status(201).json(savedEvent);
  } catch (err) {
    // console.error("Error creating event:", err);
    res.status(400).json({ message: err.message });
  }
});

// Update event
router.put("/:id", async (req, res) => {
  try {
    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedEvent) {
      return res.status(404).json({ message: "Patch Schedule not found" });
    }
    res.json(updatedEvent);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete event
router.delete("/:id", async (req, res) => {
  try {
    const deletedEvent = await Event.findByIdAndDelete(req.params.id);
    if (!deletedEvent) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.json({ message: "Patch Schedule deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Make sure to export the router
module.exports = router;
