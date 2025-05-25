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

import { AuthState } from "../../context/AuthProvider";
import { Notify } from "../../utils";

const HomePage = () => {
  const [events, setEvents] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

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
        title: `${event.customerName} (${event.serverGroup}) - ${event.osType}`,
        start: event.scheduleStartTime,
        end: event.scheduleEndTime,

        // Extended properties (will appear in event click)
        extendedProps: {
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
            ? "#ffe66d"
            : "#51cf66",
        borderColor:
          event.ticketCreationStatus === "Failed"
            ? "#ff6b6b"
            : event.ticketCreationStatus === "Pending"
            ? "#ffe66d"
            : "#51cf66",
        textColor: "#1a1a1a",
      }));

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
        eventColor="#3788d8"
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
        locale={"en"}
        selectable="true"
        editable="true"
        // weekNumbers="true"
        dayMaxEvents="true"
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
    </div>
  );
};

export default HomePage;
