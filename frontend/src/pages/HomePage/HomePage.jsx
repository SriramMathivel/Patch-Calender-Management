import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import timeGridPlugin from "@fullcalendar/timegrid";
import multiMonthPlugin from "@fullcalendar/multimonth";
import AddEventModal from "../AddEventModal/AddEventModal";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import bootstrap5Plugin from "@fullcalendar/bootstrap5";

// Add MUI imports
import {
  Modal,
  Box,
  Typography,
  Button,
  Stack,
  TextField,
} from "@mui/material";

import { AuthState } from "../../context/AuthProvider";
import { Notify } from "../../utils";

const HomePage = () => {
  const [events, setEvents] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedEvent, setEditedEvent] = useState(null);

  // Modal style
  const modalStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 600,
    bgcolor: "background.paper",
    boxShadow: 24,
    p: 4,
    borderRadius: 2,
  };

  // Handle event click
  const handleEventClick = (clickInfo) => {
    if (!clickInfo.event.id) {
      console.error("No ID found in event:", clickInfo.event);
      Notify("Event has no valid ID", "error");
      return;
    }
    // Preserve all critical fields including ID
    setSelectedEvent({
      id: clickInfo.event.id, // Explicitly preserve ID
      title: clickInfo.event.title,
      start: new Date(clickInfo.event.start),
      end: new Date(clickInfo.event.end),
      extendedProps: {
        ...clickInfo.event.extendedProps, // Spread all extended props
        // Ensure these critical fields exist
        customerName: clickInfo.event.extendedProps.customerName,
        osType: clickInfo.event.extendedProps.osType,
        serverGroup: clickInfo.event.extendedProps.serverGroup,
      },
    });

    setEditedEvent({
      customerName: clickInfo.event.extendedProps.customerName,
      osType: clickInfo.event.extendedProps.osType,
      serverGroup: clickInfo.event.extendedProps.serverGroup,
      scheduleStartTime: clickInfo.event.start.toISOString().slice(0, 16), // Format for datetime-local input
      scheduleEndTime: clickInfo.event.end.toISOString().slice(0, 16),
    });
  };

  // Handle close modal
  const handleCloseModal = () => {
    setSelectedEvent(null);
    setEditMode(false);
  };

  // Handle edit event
  const handleEditEvent = async () => {
    try {
      if (!selectedEvent?.id) {
        Notify("Invalid event ID", "error");
        return;
      }
      // eslint-disable-next-line
      const response = await axios.put(
        `http://localhost:3000/api/events/${selectedEvent.id}`,
        editedEvent
      );
      Notify("Event updated successfully", "success");
      fetchEvents(); // Refresh events
      setEditMode(false);
      setSelectedEvent(null);
    } catch (err) {
      console.error("Error updating event:", err);
      Notify("Error updating event", "error");
    }
  };

  // Handle delete event
  const handleDeleteEvent = async () => {
    try {
      if (!selectedEvent?.id) {
        Notify("Invalid event ID", "error");
        return;
      }

      await axios.delete(
        `http://localhost:3000/api/events/${selectedEvent.id}`
      );
      Notify("Event deleted successfully", "success");
      fetchEvents(); // Refresh events
      setSelectedEvent(null);
    } catch (err) {
      console.error("Error deleting event:", err);
      Notify("Error deleting event", "error");
    }
  };

  // Handle create ticket in ServiceNow and update MongoDB
  const handleCreateTicket = async () => {
    try {
      // First create ticket in ServiceNow
      const snowResponse = await axios.post(
        "http://localhost:3000/api/servicenow/tickets",
        {
          customerName: selectedEvent.extendedProps.customerName,
          serverGroup: selectedEvent.extendedProps.serverGroup,
          osType: selectedEvent.extendedProps.osType,
          startTime: selectedEvent.start,
          endTime: selectedEvent.end,
        }
      );

      // Then update MongoDB with ticket info
      await axios.put(`http://localhost:3000/api/events/${selectedEvent.id}`, {
        ticketNumber: snowResponse.data.number,
        ticketCreationStatus: "Created",
      });

      Notify("Ticket created successfully", "success");
      fetchEvents(); // Refresh events
      setSelectedEvent(null);
    } catch (err) {
      console.error("Error creating ticket:", err);

      // Update status to failed in MongoDB
      try {
        await axios.put(
          `http://localhost:3000/api/events/${selectedEvent.id}`,
          {
            ticketCreationStatus: "Failed",
          }
        );
      } catch (updateErr) {
        console.error("Error updating event status:", updateErr);
      }

      Notify("Error creating ticket", "error");
    }
  };

  // Handle input change for edit form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedEvent({
      ...editedEvent,
      [name]: value,
    });
  };
  // Handle date click
  const handleDateClick = (arg) => {
    setSelectedDate(arg.date);
    setShowAddModal(true);
  };

  const navigate = useNavigate();
  const { auth } = AuthState();

  useEffect(() => {
    if (!auth) {
      return navigate("/login");
    }
  }, [auth, navigate]);

  useEffect(() => {
    fetchEvents();
  }, []);

  // Handle new event creation
  const handleEventAdded = (newEvent) => {
    // Format for FullCalendar
    const calendarEvent = {
      id: newEvent._id,
      title: `${newEvent.customerName} (${newEvent.serverGroup}) - ${newEvent.osType}`,
      start: newEvent.scheduleStartTime,
      end: newEvent.scheduleEndTime,
      extendedProps: {
        customerName: newEvent.customerName,
        osType: newEvent.osType,
        serverGroup: newEvent.serverGroup,
        ticketStatus: newEvent.ticketCreationStatus,
        notificationStatus: newEvent.mailNotificationStatus,
      },
      backgroundColor:
        newEvent.ticketCreationStatus === "Pending" ? "#ffe66d" : "#51cf66",
    };
    Notify("Schedule created successfully", "success");
    setEvents([...events, calendarEvent]);
  };

  const fetchEvents = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/events");
      const formattedEvents = response.data.map((event) => ({
        // Required FullCalendar fields
        id: event._id, // Make sure this is included
        title: `${event.customerName} (${event.serverGroup}) - ${event.osType}`,
        start: event.scheduleStartTime,
        end: event.scheduleEndTime,

        // Extended properties (will appear in event click)
        extendedProps: {
          _id: event._id, // Duplicate ID for safety
          customerName: event.customerName,
          osType: event.osType,
          serverGroup: event.serverGroup,
          ticketNumber: event.ticketNumber,
          ticketStatus: event.ticketCreationStatus,
          notificationStatus: event.mailNotificationStatus,
          createdAt: event.createdAt,
          updatedAt: event.updatedAt,
        },
        // Optional styling based on status
        backgroundColor:
          event.ticketCreationStatus === "Failed"
            ? "#ff6b6b"
            : event.ticketCreationStatus === "Pending"
            ? "#3788d8"
            : "#51cf66",
        borderColor:
          event.ticketCreationStatus === "Failed"
            ? "#3788d8"
            : event.ticketCreationStatus === "Pending"
            ? "#ffe66d"
            : "#51cf66",
        textColor: "#1a1a1a",
      }));

      // Debug before setting state
      console.log("Formatted events:", formattedEvents);
      setEvents(formattedEvents);

      return Notify("Schedules fetched successfully", "success");
    } catch (err) {
      console.error("Error fetching events:", err);
      return Notify("Oops..Error in fetching Schedules", "error");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <FullCalendar
        plugins={[
          dayGridPlugin,
          interactionPlugin,
          bootstrap5Plugin,
          listPlugin,
          multiMonthPlugin,
          timeGridPlugin,
        ]}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        eventDisplay="block"
        initialView="dayGridMonth"
        eventTimeFormat={{
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }}
        events={events}
        // events="https://fullcalendar.io/api/demo-feeds/events.json"
        themeSystem="bootstrap5"
        firstDay={1}
        selectable="true"
        editable="true"
        // weekNumbers="true"
        dayMaxEvents={2}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right:
            "listMonth,dayGridMonth,timeGridWeek,timeGridDay,multiMonthYear",
        }}
        buttonText={{
          today: "Today",
          month: "Month",
          week: "Week",
          day: "Day",
          list: "List",
          year: "Year",
        }}
        height="80vh"
      />
      {selectedDate && (
        <AddEventModal
          show={showAddModal}
          onHide={() => setShowAddModal(false)}
          onEventAdded={handleEventAdded}
          initialStartDate={selectedDate}
        />
      )}

      {/* MUI Modal for Event Details */}
      <Modal
        open={!!selectedEvent}
        onClose={handleCloseModal}
        aria-labelledby="event-details-modal"
        aria-describedby="event-details-description"
      >
        <Box sx={modalStyle}>
          {editMode ? (
            <>
              <Typography variant="h6" component="h2" mb={3}>
                Edit Event
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label="Customer Name"
                  name="customerName"
                  value={editedEvent.customerName}
                  onChange={handleInputChange}
                  fullWidth
                />
                <TextField
                  label="OS Type"
                  name="osType"
                  value={editedEvent.osType}
                  onChange={handleInputChange}
                  fullWidth
                />
                <TextField
                  label="Server Group"
                  name="serverGroup"
                  value={editedEvent.serverGroup}
                  onChange={handleInputChange}
                  fullWidth
                />
                <TextField
                  label="Start Time"
                  type="datetime-local"
                  name="scheduleStartTime"
                  value={editedEvent.scheduleStartTime}
                  onChange={handleInputChange}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
                <TextField
                  label="End Time"
                  type="datetime-local"
                  name="scheduleEndTime"
                  value={editedEvent.scheduleEndTime}
                  onChange={handleInputChange}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Stack>
              <Stack direction="row" spacing={2} mt={3}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleEditEvent}
                >
                  Save Changes
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => setEditMode(false)}
                >
                  Cancel
                </Button>
              </Stack>
            </>
          ) : (
            <>
              <Typography variant="h6" component="h2" mb={2}>
                <center>Patching Schedule Details</center>
              </Typography>
              <Typography variant="body1" mb={1}>
                <strong>Customer:</strong>{" "}
                {selectedEvent?.extendedProps.customerName}
              </Typography>
              <Typography variant="body1" mb={1}>
                <strong>OS Type:</strong> {selectedEvent?.extendedProps.osType}
              </Typography>
              <Typography variant="body1" mb={1}>
                <strong>Server Group:</strong>{" "}
                {selectedEvent?.extendedProps.serverGroup}
              </Typography>
              <Typography variant="body1" mb={1}>
                <strong>Start:</strong> {selectedEvent?.start?.toLocaleString()}
              </Typography>
              <Typography variant="body1" mb={1}>
                <strong>End:</strong> {selectedEvent?.end?.toLocaleString()}
              </Typography>
              <Typography variant="body1" mb={1}>
                <strong>Ticket Creation Status:</strong>{" "}
                {selectedEvent?.extendedProps.ticketStatus || "Not created"}
              </Typography>
              {selectedEvent?.extendedProps.ticketNumber && (
                <Typography variant="body1" mb={3}>
                  <strong>Ticket Number:</strong>{" "}
                  {selectedEvent?.extendedProps.ticketNumber}
                </Typography>
              )}

              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setEditMode(true)}
                >
                  Edit
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleDeleteEvent}
                >
                  Delete
                </Button>
                {selectedEvent?.extendedProps.ticketStatus !== "Created" && (
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleCreateTicket}
                  >
                    Create Ticket
                  </Button>
                )}
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleCloseModal}
                >
                  Close
                </Button>
              </Stack>
            </>
          )}
        </Box>
      </Modal>
    </div>
  );
};

export default HomePage;
