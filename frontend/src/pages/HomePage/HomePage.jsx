import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import multiMonthPlugin from "@fullcalendar/multimonth";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import bootstrap5Plugin from "@fullcalendar/bootstrap5";

import {
  Box,
  Modal,
  CircularProgress,
  Snackbar,
  Stack,
  Alert,
  Typography,
  TextField,
  Button,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import {
  CheckCircle,
  Edit,
  Delete,
  Error,
  Launch as LaunchIcon,
  Pending,
} from "@mui/icons-material";
import ContentCopy from "@mui/icons-material/ContentCopy";
import Mail from "@mui/icons-material/Mail";
import ConfirmationNumber from "@mui/icons-material/ConfirmationNumber";
import Tooltip from "@mui/material/Tooltip";
import { DateTimePicker } from "@mui/x-date-pickers";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import axios from "axios";
import { AuthState } from "../../context/AuthProvider";
import format from "date-fns/format";

const HomePage = () => {
  const navigate = useNavigate();
  const { auth } = AuthState();

  // Main state
  const [events, setEvents] = useState([]);
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    customerName: "",
    serverGroup: "",
    osType: "",
    scheduleStartTime: new Date(),
    scheduleEndTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
  });
  const [errors, setErrors] = useState({
    customerName: false,
    serverGroup: false,
    osType: false,
    scheduleStartTime: false,
    scheduleEndTime: false,
  });

  // Derived state
  const filterOptions = {
    customers: [...new Set(servers.map((s) => s.customerName))].filter(Boolean),
    serverGroups: [...new Set(servers.map((s) => s.serverGroup))].filter(
      Boolean
    ),
    osTypes: [...new Set(servers.map((s) => s.osType))].filter(Boolean),
  };

  // Get filtered server groups for current customer
  const getServerGroupOptions = () => {
    if (!formData.customerName) return filterOptions.serverGroups;
    return [
      ...new Set(
        servers
          .filter((s) => s.customerName === formData.customerName)
          .map((s) => s.serverGroup)
      ),
    ].filter(Boolean);
  };

  // Get filtered OS types for current customer and server group
  const getOSTypeOptions = () => {
    if (!formData.customerName || !formData.serverGroup)
      return filterOptions.osTypes;

    return [
      ...new Set(
        servers
          .filter(
            (s) =>
              s.customerName === formData.customerName &&
              s.serverGroup === formData.serverGroup
          )
          .map((s) => s.osType)
      ),
    ].filter(Boolean);
  };

  useEffect(() => {
    if (!auth) navigate("/login");
    else fetchData();
  }, [auth]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eventsRes, serversRes] = await Promise.all([
        axios.get("/api/events"),
        axios.get("/api/servers"),
      ]);

      setServers(serversRes.data?.data || []);
      setEvents(transformEvents(eventsRes.data));
    } catch (error) {
      showSnackbar("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  const transformEvents = (events) =>
    events.map((event) => {
      const baseEvent = {
        id: event._id,
        title: `${event.customerName} - (${event.serverGroup}) - ${event.osType}`,
        start: new Date(event.scheduleStartTime),
        end: new Date(event.scheduleEndTime),
        extendedProps: {
          ...event,
          servers: servers.filter(
            (s) =>
              s.serverGroup === event.serverGroup &&
              s.customerName === event.customerName &&
              s.osType === event.osType
          ),
        },
      };

      // Add color properties based on ticket creation status
      if (event.ticketCreationStatus === "Created") {
        baseEvent.backgroundColor = "#28a745"; // Green
        baseEvent.borderColor = "#28a745";
        baseEvent.textColor = "white";
      } else if (event.ticketCreationStatus === "Failed") {
        baseEvent.backgroundColor = "#dc3545"; // Red
        baseEvent.borderColor = "#dc3545";
        baseEvent.textColor = "white";
      }

      return baseEvent;
    });

  // Event Handlers
  const handleDateClick = (arg) => {
    if (arg.date < new Date()) {
      showSnackbar("Cannot schedule activities in past", "error");
      return;
    }
    setFormData({
      customerName: "",
      serverGroup: "",
      osType: "",
      scheduleStartTime: arg.date,
      scheduleEndTime: new Date(arg.date.getTime() + 6 * 60 * 60 * 1000),
    });
    setModalOpen("add");
  };

  const handleEventClick = (info) => {
    setSelectedEvent({
      ...info.event.toPlainObject(),
      extendedProps: {
        ...info.event.extendedProps,
        servers: servers.filter(
          (s) =>
            s.serverGroup === info.event.extendedProps.serverGroup &&
            s.customerName === info.event.extendedProps.customerName &&
            s.osType === info.event.extendedProps.osType
        ),
      },
    });
    setModalOpen("view");
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      const method = selectedEvent ? "put" : "post";
      const url = selectedEvent
        ? `/api/events/${selectedEvent.id}`
        : "/api/events";

      const payload = {
        ...formData,
        scheduleStartTime: formData.scheduleStartTime.toISOString(),
        scheduleEndTime: formData.scheduleEndTime.toISOString(),
      };

      await axios[method](url, payload);
      await fetchData();
      showSnackbar(
        `Patch Schedule ${selectedEvent ? "updated" : "created"}`,
        "success"
      );
      closeModal();
    } catch (error) {
      showSnackbar(
        `Error ${selectedEvent ? "updating" : "creating"} Patch Schedule`,
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(`/api/events/${selectedEvent.id}`);
      await fetchData();
      showSnackbar("Patch Schedule deleted", "success");
      closeModal();
      setDeleteConfirmOpen(false);
    } catch (error) {
      showSnackbar("Error deleting Schedule", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setDeleteConfirmOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
  };

  // ServiceNow Ticket Creation with custom headers
  const handleCreateTicket = async () => {
    if (!selectedEvent) return;

    setIsCreatingTicket(true);
    try {
      const { customerName, serverGroup, osType, servers } =
        selectedEvent.extendedProps;

      // Make request to backend endpoint
      const response = await axios.post("/api/tickets", {
        customerName,
        serverGroup,
        osType,
        servers,
        start: selectedEvent.start,
        end: selectedEvent.end,
      });

      const ticketNumber = response.data.ticketNumber;

      // Update event with ticket number
      await axios.put(`/api/events/${selectedEvent.id}`, {
        ticketNumber,
        ticketCreationStatus: "Created",
      });

      // Update local state
      setSelectedEvent((prev) => ({
        ...prev,
        extendedProps: {
          ...prev.extendedProps,
          ticketNumber,
          ticketCreationStatus: "Created",
        },
      }));

      showSnackbar(`Ticket ${ticketNumber} created successfully!`, "success");
    } catch (error) {
      console.error("Ticket creation failed:", error);

      // Update event with failure status
      try {
        await axios.put(`/api/events/${selectedEvent.id}`, {
          ticketCreationStatus: "Failed",
        });

        setSelectedEvent((prev) => ({
          ...prev,
          extendedProps: {
            ...prev.extendedProps,
            ticketCreationStatus: "Failed",
          },
        }));
      } catch (updateError) {
        console.error("Failed to update event status:", updateError);
      }

      showSnackbar("Failed to create ServiceNow ticket", "error");
    } finally {
      setIsCreatingTicket(false);
    }
  };

  // Helper functions
  const validateForm = () => {
    const newErrors = {
      customerName: !formData.customerName,
      serverGroup: !formData.serverGroup,
      osType: !formData.osType,
      scheduleStartTime: formData.scheduleStartTime < new Date(),
      scheduleEndTime: formData.scheduleEndTime <= formData.scheduleStartTime,
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const showSnackbar = (message, severity) =>
    setSnackbar({ open: true, message, severity });

  const closeModal = () => {
    setModalOpen(null);
    setSelectedEvent(null);
    setErrors({
      customerName: false,
      serverGroup: false,
      osType: false,
      scheduleStartTime: false,
      scheduleEndTime: false,
    });
  };

  const handleCopyContent = () => {
    if (!selectedEvent) return;

    const mainTable = document.getElementById("event-details-table");
    const mainTableRows = mainTable.querySelectorAll("tr");
    let mainTableText = "Event Details:\n\n";

    mainTableRows.forEach((row) => {
      const cells = row.querySelectorAll("td");
      const rowText = Array.from(cells)
        .map((cell) => cell.innerText.trim())
        .filter((text) => text !== "")
        .join("\t");

      if (rowText) {
        mainTableText += rowText + "\n";
      }
    });

    const serversTable = document.getElementById("servers-table");
    const serversTableRows = serversTable.querySelectorAll("tr");
    let serversTableText = "\nAffected Servers:\n\n";

    serversTableRows.forEach((row) => {
      const cells = row.querySelectorAll("th, td");
      const rowText = Array.from(cells)
        .map((cell) => cell.innerText.trim())
        .join("\t");

      serversTableText += rowText + "\n";
    });

    const fullText = mainTableText + serversTableText;

    navigator.clipboard
      .writeText(fullText)
      .then(() => {
        showSnackbar("Content copied to clipboard", "success");
      })
      .catch((err) => {
        console.error("Failed to copy content:", err);
        showSnackbar("Failed to copy content", "error");
      });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3, height: "90vh" }}>
        <FullCalendar
          plugins={[
            dayGridPlugin,
            interactionPlugin,
            bootstrap5Plugin,
            listPlugin,
            multiMonthPlugin,
            timeGridPlugin,
          ]}
          eventDisplay="block"
          initialView="dayGridMonth"
          eventTimeFormat={{
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }}
          events={events}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          nowIndicator={true}
          themeSystem="bootstrap5"
          firstDay={1}
          selectable="true"
          editable="true"
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
          height="100%"
        />

        {/* Add/Edit Modal */}
        <Modal open={modalOpen === "add"} onClose={closeModal}>
          <Box sx={modalStyle} component="form" onSubmit={handleFormSubmit}>
            <Typography variant="h6" mb={2} mt={1}>
              <center>
                {selectedEvent
                  ? "Edit Schedule"
                  : "Create New Patching Schedule"}
              </center>
            </Typography>
            <Stack spacing={2}>
              <Autocomplete
                options={filterOptions.customers}
                value={formData.customerName}
                onChange={(_, value) =>
                  setFormData((prev) => ({
                    ...prev,
                    customerName: value,
                    serverGroup: "",
                    osType: "",
                  }))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Customer Name *"
                    error={errors.customerName}
                    helperText={errors.customerName && "Required field"}
                  />
                )}
              />
              <Stack direction="row" spacing={2}>
                <Autocomplete
                  options={getServerGroupOptions()}
                  value={formData.serverGroup}
                  onChange={(_, value) =>
                    setFormData((prev) => ({
                      ...prev,
                      serverGroup: value,
                      osType: "",
                    }))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Server Group *"
                      error={errors.serverGroup}
                      helperText={errors.serverGroup && "Required field"}
                    />
                  )}
                  disabled={!formData.customerName}
                  sx={{ flex: 1 }}
                />
                <Autocomplete
                  options={getOSTypeOptions()}
                  value={formData.osType}
                  onChange={(_, value) =>
                    setFormData((prev) => ({
                      ...prev,
                      osType: value,
                    }))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="OS Type *"
                      error={errors.osType}
                      helperText={errors.osType && "Required field"}
                    />
                  )}
                  disabled={!formData.serverGroup}
                  sx={{ flex: 1 }}
                />
              </Stack>
              <Stack direction="row" spacing={2}>
                <DateTimePicker
                  label="Start Time *"
                  value={formData.scheduleStartTime}
                  onChange={(newValue) =>
                    setFormData((prev) => ({
                      ...prev,
                      scheduleStartTime: newValue,
                      scheduleEndTime: new Date(
                        newValue.getTime() + 6 * 60 * 60 * 1000
                      ),
                    }))
                  }
                  slotProps={{
                    textField: {
                      error: errors.scheduleStartTime,
                      helperText:
                        errors.scheduleStartTime && "Cannot be in past",
                    },
                    popper: {
                      placement: "right-start",
                    },
                  }}
                />

                <DateTimePicker
                  label="End Time *"
                  value={formData.scheduleEndTime}
                  onChange={(newValue) =>
                    setFormData((prev) => ({
                      ...prev,
                      scheduleEndTime: newValue,
                    }))
                  }
                  minDateTime={formData.scheduleStartTime}
                  slotProps={{
                    textField: {
                      error: errors.scheduleEndTime,
                      helperText:
                        errors.scheduleEndTime && "Must be after start time",
                    },
                    popper: {
                      placement: "right-start",
                    },
                  }}
                />
              </Stack>

              <Button type="submit" variant="contained" size="large">
                {selectedEvent ? "Update Schedule" : "Create Schedule"}
              </Button>
            </Stack>
          </Box>
        </Modal>

        {/* View Modal */}
        <Modal open={modalOpen === "view"} onClose={closeModal}>
          <Box sx={viewModalStyle}>
            {selectedEvent && (
              <>
                <Stack direction="row" justifyContent="space-between" mb={3}>
                  <Stack direction="row" spacing={1}>
                    <Chip
                      size="small"
                      icon={
                        selectedEvent.extendedProps.ticketCreationStatus ===
                        "Created" ? (
                          <CheckCircle />
                        ) : selectedEvent.extendedProps.ticketCreationStatus ===
                          "Failed" ? (
                          <Error />
                        ) : (
                          <Pending />
                        )
                      }
                      label={`Ticket ${
                        selectedEvent.extendedProps.ticketCreationStatus ||
                        "Not Created"
                      }`}
                      color={
                        selectedEvent.extendedProps.ticketCreationStatus ===
                        "Created"
                          ? "success"
                          : selectedEvent.extendedProps.ticketCreationStatus ===
                            "Failed"
                          ? "error"
                          : "warning"
                      }
                    />
                    <Chip
                      size="small"
                      icon={
                        selectedEvent.extendedProps.mailNotificationStatus ===
                        "Sent" ? (
                          <CheckCircle />
                        ) : selectedEvent.extendedProps
                            .mailNotificationStatus === "Failed" ? (
                          <Error />
                        ) : (
                          <Pending />
                        )
                      }
                      label={`Email ${selectedEvent.extendedProps.mailNotificationStatus}`}
                      color={
                        selectedEvent.extendedProps.mailNotificationStatus ===
                        "Sent"
                          ? "success"
                          : selectedEvent.extendedProps
                              .mailNotificationStatus === "Not Sent"
                          ? "error"
                          : "warning"
                      }
                    />
                  </Stack>

                  {/* Action Buttons */}
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Create Ticket">
                      <span>
                        <IconButton
                          onClick={handleCreateTicket}
                          color="primary"
                          disabled={
                            selectedEvent.extendedProps.ticketCreationStatus ===
                              "Created" || isCreatingTicket
                          }
                        >
                          {isCreatingTicket ? (
                            <CircularProgress size={20} />
                          ) : (
                            <ConfirmationNumber fontSize="small" />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>

                    <Tooltip title="Send Mail">
                      <IconButton
                        onClick={() => console.log("Send Mail clicked")}
                        color="primary"
                      >
                        <Mail fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Copy Content">
                      <IconButton onClick={handleCopyContent} color="primary">
                        <ContentCopy fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <IconButton
                      onClick={() => {
                        setFormData({
                          customerName:
                            selectedEvent.extendedProps.customerName,
                          serverGroup: selectedEvent.extendedProps.serverGroup,
                          osType: selectedEvent.extendedProps.osType,
                          scheduleStartTime: new Date(selectedEvent.start),
                          scheduleEndTime: new Date(selectedEvent.end),
                        });
                        setModalOpen("add");
                      }}
                      color="primary"
                    >
                      <Edit />
                    </IconButton>

                    <IconButton onClick={handleDeleteClick} color="error">
                      <Delete />
                    </IconButton>
                  </Stack>
                </Stack>

                {/* Event Details Table */}
                <Table size="small" sx={{ mb: 3 }} id="event-details-table">
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <strong>Customer Name:</strong>
                      </TableCell>
                      <TableCell>
                        {selectedEvent.extendedProps.customerName}
                      </TableCell>
                      <TableCell>
                        <strong>OS Type:</strong>
                      </TableCell>
                      <TableCell>
                        {selectedEvent.extendedProps.osType}
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>
                        <strong>Start Time:</strong>
                      </TableCell>
                      <TableCell>
                        {format(selectedEvent.start, "PPpp")}
                      </TableCell>
                      <TableCell>
                        <strong>End Time:</strong>
                      </TableCell>
                      <TableCell>{format(selectedEvent.end, "PPpp")}</TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>
                        <strong>Server Group:</strong>
                      </TableCell>
                      <TableCell>
                        {selectedEvent.extendedProps.serverGroup}
                      </TableCell>

                      {selectedEvent.extendedProps.ticketNumber && (
                        <>
                          <TableCell>
                            <strong>Ticket Number:</strong>
                          </TableCell>
                          <TableCell colSpan={3}>
                            {selectedEvent.extendedProps.ticketNumber}
                            <IconButton
                              href={`${process.env.REACT_APP_SN_BASE_URL}/nav_to.do?uri=task.do?sysparm_query=number=${selectedEvent.extendedProps.ticketNumber}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              size="small"
                            >
                              <LaunchIcon fontSize="24" />
                            </IconButton>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  </TableBody>
                </Table>

                <Typography variant="subtitle1" gutterBottom>
                  Affected Servers (
                  {selectedEvent.extendedProps.servers?.length || 0})
                </Typography>

                {/* Servers Table */}
                <Box
                  sx={{ maxHeight: 300, overflow: "auto" }}
                  id="servers-table"
                >
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Hostname</TableCell>
                        <TableCell>IP</TableCell>
                        <TableCell>OS</TableCell>
                        <TableCell>Managed DBA</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedEvent.extendedProps.servers?.map((server) => (
                        <TableRow key={server.CID}>
                          <TableCell>{server.hostname}</TableCell>
                          <TableCell>{server.ip}</TableCell>
                          <TableCell>{server.osType}</TableCell>
                          <TableCell>{server.mDBA}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </>
            )}
          </Box>
        </Modal>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteConfirmOpen}
          onClose={handleDeleteCancel}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">{"Confirm Delete"}</DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              Are you sure you want to delete this patching schedule? This
              action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteCancel}>Cancel</Button>
            <Button onClick={handleDelete} color="error" autoFocus>
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Loading */}
        <Modal open={loading} sx={loadingStyle}>
          <CircularProgress />
        </Modal>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          autoHideDuration={6000}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        >
          <Alert variant="filled" severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

// Styles
const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 550,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 3,
  borderRadius: 2,
};

const viewModalStyle = {
  ...modalStyle,
  width: 1000,
  maxHeight: "95vh",
  overflow: "auto",
};

const loadingStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export default HomePage;
