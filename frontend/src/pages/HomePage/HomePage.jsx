import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import multiMonthPlugin from "@fullcalendar/multimonth";
import AddEventModal from "../AddEventModal/AddEventModal";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import bootstrap5Plugin from "@fullcalendar/bootstrap5";

import { AuthState } from "../../context/AuthProvider";
import { Notify } from "../../utils";

const HomePage = () => {
  // const [userData, setUserData] = useState(null);
  const [events, setEvents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const navigate = useNavigate();
  const { auth } = AuthState();
  useEffect(() => {
    if (!auth) {
      return navigate("/login");
    }
  }, [auth, navigate]);
  const handleDateClick = (arg) => {
    setSelectedDate(arg.date);
    setIsModalOpen(true);
  };
  useEffect(() => {
    fetchEvents();
  }, []);
  // Function to handle new event addition
  const handleEventAdded = (newEvent) => {
    setEvents([
      ...events,
      {
        title: newEvent.title,
        start: newEvent.start,
        end: newEvent.end,
      },
    ]);
    setIsModalOpen(false);
    Notify("Schedule created successfully", "success");
  };
  const fetchEvents = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/events");
      const formattedEvents = response.data.map((event) => ({
        title: event.title,
        start: event.start,
        end: event.end,
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
        ]}
        dateClick={handleDateClick}
        initialView="dayGridMonth"
        events={events}
        // events="https://fullcalendar.io/api/demo-feeds/events.json"
        themeSystem="bootstrap5"
        firstDay={1}
        locale={"en"}
        selectable="true"
        editable="true"
        weekNumbers="true"
        dayMaxEvents="true"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "listMonth,dayGridMonth,dayGridWeek,dayGridDay,multiMonthYear",
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
      {isModalOpen && (
        <AddEventModal
          onClose={() => setIsModalOpen(false)}
          onEventAdded={handleEventAdded}
          selectedDate={selectedDate}
        />
      )}
    </div>
  );
};

export default HomePage;
