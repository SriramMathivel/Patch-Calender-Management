import { useState, useEffect } from "react";
import axios from "axios";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  Alert,
  Typography,
  Button,
  Modal,
  Stack,
  MenuItem,
  Box,
  TextField,
} from "@mui/material";

const AddEventModal = ({ show, onHide, onEventAdded, initialStartDate }) => {
  // Calculate default end time (always +4 hours from current start time)
  const calculateDefaultEndDate = (startDate) => {
    return new Date(startDate.getTime() + 4 * 60 * 60 * 1000);
  };

  const [formData, setFormData] = useState({
    customerName: "",
    osType: "Windows",
    serverGroup: "",
    scheduleStartTime: initialStartDate || new Date(),
    scheduleEndTime: calculateDefaultEndDate(initialStartDate || new Date()),
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [errors, setErrors] = useState({
    customerName: false,
    osType: false,
    serverGroup: false,
    scheduleStartTime: false,
    scheduleEndTime: false,
  });

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

  // Update form dates when initialStartDate changes
  useEffect(() => {
    if (initialStartDate) {
      setFormData((prev) => ({
        ...prev,
        scheduleStartTime: initialStartDate,
        scheduleEndTime: calculateDefaultEndDate(initialStartDate),
      }));
    }
  }, [initialStartDate]);

  // Reset all fields except dates
  const resetForm = () => {
    setFormData((prev) => ({
      customerName: "",
      osType: "Windows",
      serverGroup: "",
      scheduleStartTime: prev.scheduleStartTime, // Keep current dates
      scheduleEndTime: prev.scheduleEndTime,
    }));
    setError(null);
    setErrors({
      customerName: false,
      osType: false,
      serverGroup: false,
      scheduleStartTime: false,
      scheduleEndTime: false,
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: false,
      });
    }
  };

  const handleDateTimeChange = (name, date) => {
    setFormData((prev) => ({ ...prev, [name]: date }));

    // Clear error when date is changed
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: false,
      });
    }
  };

  const validateForm = () => {
    const now = new Date();
    const startTime = new Date(formData.scheduleStartTime);
    const endTime = new Date(formData.scheduleEndTime);

    const newErrors = {
      customerName: !formData.customerName,
      osType: !formData.osType,
      serverGroup: !formData.serverGroup,
      scheduleStartTime: !formData.scheduleStartTime || startTime < now,
      scheduleEndTime:
        !formData.scheduleEndTime || endTime <= startTime || endTime < now,
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await axios.post("http://localhost:3000/api/events", {
        ...formData,
        scheduleStartTime: formData.scheduleStartTime.toISOString(),
        scheduleEndTime: formData.scheduleEndTime.toISOString(),
      });

      onEventAdded(response.data);
      resetForm(); // Reset form after successful submission
      onHide();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create event");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm(); // Reset form when manually closed
    onHide();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Modal
        open={show}
        onClose={handleClose}
        aria-labelledby="add-event-modal"
        aria-describedby="add-event-description"
      >
        <Box sx={modalStyle}>
          <Typography variant="h6" component="h3" mb={3}>
            <center>Add Patching Schedule</center>
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                label="Customer Name"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                fullWidth
                required
                error={errors.customerName}
                helperText={
                  errors.customerName ? "Customer name is required" : ""
                }
              />

              <Stack direction="row" spacing={2}>
                <TextField
                  select
                  label="OS Type"
                  name="osType"
                  value={formData.osType}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  error={errors.osType}
                  helperText={errors.osType ? "OS type is required" : ""}
                >
                  <MenuItem value="Windows">Windows</MenuItem>
                  <MenuItem value="Unix">Unix</MenuItem>
                </TextField>

                <TextField
                  label="Server Group"
                  name="serverGroup"
                  value={formData.serverGroup}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  error={errors.serverGroup}
                  helperText={
                    errors.serverGroup ? "Server group is required" : ""
                  }
                />
              </Stack>

              <Stack direction="row" spacing={2}>
                <DateTimePicker
                  label="Start Time *"
                  value={formData.scheduleStartTime}
                  onChange={(date) =>
                    handleDateTimeChange("scheduleStartTime", date)
                  }
                  format="MMM d, yyyy h:mm aa"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      error: errors.scheduleStartTime,
                      helperText: errors.scheduleStartTime
                        ? new Date(formData.scheduleStartTime) < new Date()
                          ? "Start time cannot be in the past"
                          : "Start time is required"
                        : "",
                    },
                  }}
                />

                <DateTimePicker
                  label="End Time *"
                  value={formData.scheduleEndTime}
                  onChange={(date) =>
                    handleDateTimeChange("scheduleEndTime", date)
                  }
                  format="MMM d, yyyy h:mm aa"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      error: errors.scheduleEndTime,
                      helperText: errors.scheduleEndTime
                        ? !formData.scheduleEndTime
                          ? "End time is required"
                          : new Date(formData.scheduleEndTime) <=
                            new Date(formData.scheduleStartTime)
                          ? "End time must be after start time"
                          : new Date(formData.scheduleEndTime) < new Date()
                          ? "End time cannot be in the past"
                          : ""
                        : "",
                    },
                  }}
                />
              </Stack>

              <Stack direction="row" spacing={2} mt={3}>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  fullWidth
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  disabled={isSubmitting}
                  fullWidth
                >
                  {isSubmitting ? "Creating..." : "Create Event"}
                </Button>
              </Stack>
            </Stack>
          </form>
        </Box>
      </Modal>
    </LocalizationProvider>
  );
};

export default AddEventModal;
