import React, { useState } from "react";
import axios from "axios";

const AddEventModal = ({ onClose, onEventAdded, selectedDate }) => {
  const [title, setTitle] = useState("");

  // Helper function to format date for datetime-local input
  const toDateTimeLocalString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Default to selected date or current time if not provided
  const defaultStart = selectedDate || new Date();
  const defaultEnd = new Date(defaultStart.getTime() + 3600000); // 1 hour later

  const [start, setStart] = useState(toDateTimeLocalString(defaultStart));
  const [end, setEnd] = useState(toDateTimeLocalString(defaultEnd));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:3000/api/events", {
        title,
        start: new Date(start),
        end: new Date(end),
      });
      onEventAdded(response.data);
      onClose();
    } catch (err) {
      console.error("Error creating event:", err);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        width: "700px",
        transform: "translate(-50%, -50%)",
        backgroundColor: "rgb(201, 219, 236)",
        padding: "20px",
        zIndex: 1000,
        border: "1px solid #ccc",
        boxShadow: "0 10px 10px rgba(0,0,0,0.3)",
        borderRadius: "8px",
      }}
    >
      <center>
        <h4 style={{ marginTop: 0 }}>Add New Schedule</h4>
      </center>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "10px" }}
      >
        <label style={{ display: "block", marginBottom: "5px" }}>
          Customer Name:
        </label>
        <input
          type="text"
          placeholder="Event Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{ padding: "8px", fontSize: "16px" }}
        />
        <div>
          <label style={{ display: "block", marginBottom: "5px" }}>
            Start Time:
          </label>
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            required
            style={{ padding: "8px", fontSize: "16px" }}
          />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: "5px" }}>
            End Time:
          </label>
          <input
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            required
            style={{ padding: "8px", fontSize: "16px" }}
          />
        </div>
        <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
          <button
            type="submit"
            style={{
              padding: "8px 16px",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Save
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 16px",
              backgroundColor: "#f44336",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddEventModal;
