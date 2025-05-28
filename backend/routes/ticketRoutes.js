const express = require("express");
const { createServiceNowTicket } = require("../controllers/ticketController");

const router = express.Router();

router.post("/", createServiceNowTicket);

module.exports = router;
