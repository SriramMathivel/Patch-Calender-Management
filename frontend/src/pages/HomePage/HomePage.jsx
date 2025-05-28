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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
  IconButton,
  Chip,
} from "@mui/material";
import { CheckCircle, Warning, Edit, Delete, Add } from "@mui/icons-material";
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
    events.map((event) => ({
      id: event._id,
      title: `${event.customerName} (${event.serverGroup})`,
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
    }));

  // Event Handlers
  const handleDateClick = (arg) => {
    if (arg.date < new Date()) {
      showSnackbar("Cannot schedule past events", "error");
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
      showSnackbar(`Event ${selectedEvent ? "updated" : "created"}`, "success");
      closeModal();
    } catch (error) {
      showSnackbar(
        `Error ${selectedEvent ? "updating" : "creating"} event`,
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
      showSnackbar("Event deleted", "success");
      closeModal();
    } catch (error) {
      showSnackbar("Error deleting event", "error");
    } finally {
      setLoading(false);
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
            <Typography variant="h6" mb={3}>
              {selectedEvent ? "Edit Schedule" : "New Patching Schedule"}
            </Typography>

            <Stack spacing={3}>
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

              <FormControl fullWidth error={errors.serverGroup}>
                <InputLabel>Server Group *</InputLabel>
                <Select
                  value={formData.serverGroup}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      serverGroup: e.target.value,
                      osType: "",
                    }))
                  }
                >
                  {filterOptions.serverGroups
                    .filter((group) =>
                      servers.some(
                        (s) =>
                          s.customerName === formData.customerName &&
                          s.serverGroup === group
                      )
                    )
                    .map((group) => (
                      <MenuItem key={group} value={group}>
                        {group}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

              <FormControl fullWidth error={errors.osType}>
                <InputLabel>OS Type *</InputLabel>
                <Select
                  value={formData.osType}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      osType: e.target.value,
                    }))
                  }
                >
                  {filterOptions.osTypes
                    .filter((os) =>
                      servers.some(
                        (s) =>
                          s.customerName === formData.customerName &&
                          s.serverGroup === formData.serverGroup &&
                          s.osType === os
                      )
                    )
                    .map((os) => (
                      <MenuItem key={os} value={os}>
                        {os}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

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
                    helperText: errors.scheduleStartTime && "Cannot be in past",
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
                }}
              />

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
                  <Typography variant="h5">
                    {selectedEvent.extendedProps.customerName}
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Chip
                      icon={
                        selectedEvent.extendedProps.ticketCreationStatus ===
                        "Created" ? (
                          <CheckCircle />
                        ) : (
                          <Warning />
                        )
                      }
                      label={`Ticket ${selectedEvent.extendedProps.ticketCreationStatus}`}
                      color={
                        selectedEvent.extendedProps.ticketCreationStatus ===
                        "Created"
                          ? "success"
                          : "error"
                      }
                    />
                    <Chip
                      icon={
                        selectedEvent.extendedProps.mailNotificationStatus ===
                        "Sent" ? (
                          <CheckCircle />
                        ) : (
                          <Warning />
                        )
                      }
                      label={`Email ${selectedEvent.extendedProps.mailNotificationStatus}`}
                      color={
                        selectedEvent.extendedProps.mailNotificationStatus ===
                        "Sent"
                          ? "success"
                          : "error"
                      }
                    />
                  </Stack>
                </Stack>

                <Table size="small" sx={{ mb: 3 }}>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <strong>Server Group:</strong>
                      </TableCell>
                      <TableCell>
                        {selectedEvent.extendedProps.serverGroup}
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
                    {selectedEvent.extendedProps.ticketNumber && (
                      <TableRow>
                        <TableCell>
                          <strong>Ticket Number:</strong>
                        </TableCell>
                        <TableCell colSpan={3}>
                          {selectedEvent.extendedProps.ticketNumber}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                <Typography variant="subtitle1" gutterBottom>
                  Affected Servers (
                  {selectedEvent.extendedProps.servers?.length || 0})
                </Typography>

                <Box sx={{ maxHeight: 300, overflow: "auto" }}>
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

                <Stack
                  direction="row"
                  spacing={2}
                  mt={3}
                  justifyContent="flex-end"
                >
                  <IconButton
                    onClick={() => {
                      setFormData({
                        customerName: selectedEvent.extendedProps.customerName,
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
                  <IconButton onClick={handleDelete} color="error">
                    <Delete />
                  </IconButton>
                </Stack>
              </>
            )}
          </Box>
        </Modal>

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
  width: 500,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
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
