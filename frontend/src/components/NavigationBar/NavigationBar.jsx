import { useState } from "react";
import {
  Container,
  Dropdown,
  DropdownButton,
  Image,
  Nav,
  Navbar,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";

import IMAGES from "../../assets"; // Importing images from single "IMAGES" object
import { AuthState } from "../../context/AuthProvider";
import ProfileModal from "../ProfileModal/ProfileModal";

import "./NavigationBar.css";

const NavigationBar = () => {
  const [modalShow, setModalShow] = useState(false);

  const navigate = useNavigate();
  const { auth, setAuth } = AuthState();

  const logoutHandler = () => {
    localStorage.removeItem("auth");
    setAuth(null);
    return navigate("/login");
  };

  return (
    <Navbar collapseOnSelect expand="md" variant="dark" id="nav">
      <Container fluid>
        <Navbar.Brand as={Link} to="/">
          <img
            alt="Tata Communications Limited"
            src={IMAGES.logo}
            width="225"
            height="15"
            className="d-inline-block align-center-left"
          />
        </Navbar.Brand>
        <Navbar.Collapse className="justify-content-left">
          <Nav>
            {auth && (
              <>
                <Nav.Link as={Link} to="/" className="nav-link">
                  Home
                </Nav.Link>
                <Nav.Link as={Link} to="/manageCustomer" className="nav-link">
                  Manage Customers
                </Nav.Link>
                <Nav.Link as={Link} to="/manageServer" className="nav-link">
                  Manage Servers
                </Nav.Link>
                <Nav.Link as={Link} to="/ExportCalendar" className="nav-link">
                  Export Calendar
                </Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Navbar.Collapse className="justify-content-end">
          {auth ? (
            <DropdownButton
              className="w-auto"
              variant=""
              title={
                <>
                  <Image
                    id="profileDropdownIcon"
                    src={auth.profilePic}
                    alt="Navbar profile image"
                    roundedCircle
                  />
                  <span className="ms-2 text-light font-weight-bold">
                    {auth.name}
                  </span>
                </>
              }
            >
              <Dropdown.Item as="button" onClick={() => setModalShow(true)}>
                Profile
              </Dropdown.Item>
              <ProfileModal
                show={modalShow}
                onHide={() => setModalShow(false)}
              />

              <Dropdown.Divider />

              <Dropdown.Item as="button" onClick={logoutHandler}>
                Log out
              </Dropdown.Item>
            </DropdownButton>
          ) : (
            <Nav.Item>
              <button
                className="nav-button me-2"
                onClick={() => navigate("/login")}
              >
                Log in
              </button>
              <button
                className="nav-button"
                onClick={() => navigate("/register")}
              >
                Register
              </button>
            </Nav.Item>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavigationBar;
