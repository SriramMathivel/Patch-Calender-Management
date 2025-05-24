export const validateEvent = (req, res, next) => {
  const { title, start, end } = req.body;
  if (!title || !start || !end) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  if (new Date(start) >= new Date(end)) {
    return res
      .status(400)
      .json({ message: "End time must be after start time" });
  }
  next();
};

// Update route import:
import { validateEvent } from "../middleware/validateEvent.js";
router.post("/", validateEvent, async (req, res) => {
  /* ... */
});
