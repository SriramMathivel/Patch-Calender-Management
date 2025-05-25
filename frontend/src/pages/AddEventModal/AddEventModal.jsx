import { useState, useEffect } from "react";
import { Modal, Button, Form, Alert, Row, Col } from "react-bootstrap";
import axios from "axios";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

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
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateTimeChange = (name, date) => {
    setFormData((prev) => ({ ...prev, [name]: date }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

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
      <Modal show={show} onHide={handleClose} size="md">
        <Modal.Header closeButton>
          <Modal.Title>Add New Event</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}

            <Form.Group className="mb-2">
              <Form.Label>Customer Name *</Form.Label>
              <Form.Control
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Row className="mb-2">
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label>OS Type *</Form.Label>
                  <Form.Select
                    name="osType"
                    value={formData.osType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="Windows">Windows</option>
                    <option value="Unix">Unix</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label>Server Group</Form.Label>
                  <Form.Control
                    name="serverGroup"
                    value={formData.serverGroup}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row className="mb-2">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Start Time *</Form.Label>
                  <DateTimePicker
                    value={formData.scheduleStartTime}
                    onChange={(date) =>
                      handleDateTimeChange("scheduleStartTime", date)
                    }
                    format="MMM d, yyyy h:mm aa"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        variant: "outlined",
                      },
                    }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>End Time *</Form.Label>
                  <DateTimePicker
                    value={formData.scheduleEndTime}
                    onChange={(date) =>
                      handleDateTimeChange("scheduleEndTime", date)
                    }
                    format="MMM d, yyyy h:mm aa"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        variant: "outlined",
                      },
                    }}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={onHide}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Event"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </LocalizationProvider>
  );
};

export default AddEventModal;
