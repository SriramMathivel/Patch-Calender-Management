const express = require("express");
const Event = require("../models/Event.js");

const router = express.Router();

// GET all events
router.get("/", async (req, res) => {
  try {
    const events = await Event.find({}, "title start end"); // Fetch only required fields
    res.json(events);
  } catch (err) {
    console.error("Error fetching events:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

// POST new event
router.post("/", async (req, res) => {
  try {
    const { title, start, end } = req.body;
    const newEvent = new Event({ title, start, end });
    await newEvent.save();
    res.status(201).json(newEvent);
  } catch (err) {
    res.status(400).json({ message: "Invalid event data" });
  }
});

// Make sure to export the router
module.exports = router;
