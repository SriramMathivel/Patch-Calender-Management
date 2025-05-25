const express = require("express");
const Event = require("../models/Event.js");

const router = express.Router();

// GET all events
router.get("/", async (req, res) => {
  try {
    // Fetch all fields except internal ones if needed
    const events = await Event.find({})
      .sort({ scheduleStartTime: 1 }) // Sort by schedule time
      .select("-__v -_id"); // Exclude version key and MongoDB ID if desired

    res.json(events);
  } catch (err) {
    console.error("Error fetching events:", err);
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

// Make sure to export the router
module.exports = router;
