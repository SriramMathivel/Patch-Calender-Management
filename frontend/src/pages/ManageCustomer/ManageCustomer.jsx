const ManageCustomer = () => {
  return (
    <div>
      <center>
        <img
          src="https://res.cloudinary.com/dcrxgzrli/image/upload/v1748154460/Tata-Group-Logo-Blue-New_idlpf0.png"
          alt="TCL Logo"
          style={{
            marginTop: "20px",
            width: "500px",
            height: "500px",
            opacity: 0.2,
          }}
        />
        <div
          className="container"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
          }}
        >
          <h1 style={{ marginTop: "20px", color: "#007bff" }}>
            Manage Customer Page
          </h1>
          <p style={{ color: "#555" }}>
            This page is under construction. Please check back later.
            <br />
            In the meantime, you can explore other features of the application.
            <br />
            Please write to{" "}
            <a href="mailto: sriram.mathivel@tatacommunications.com">
              sriram.mathivel@tatacommunications.com
            </a>{" "}
            for reporting any issues or for providing feedback.
          </p>
        </div>
      </center>
    </div>
  );
};

export default ManageCustomer;
