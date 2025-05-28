const axios = require("axios");

exports.createServiceNowTicket = async (req, res) => {
  try {
    const { customerName, serverGroup, osType, servers, start, end } = req.body;

    // Get first server's hostname as serviceIdentifier
    const serviceIdentifier = servers[0]?.name || "";

    // Determine catalogName based on OS type
    const getCatalogName = (osType) => {
      if (osType.toLowerCase().includes("windows")) {
        return "Windows - Windows OS Patching";
      } else if (osType.toLowerCase().includes("linux")) {
        return "Unix - OS patching";
      } else if (osType.toLowerCase().includes("unix")) {
        return "Unix - OS patching";
      } else if (osType.toLowerCase().includes("database")) {
        return "MS SQL User creation/modification/deletion";
      }
      return "OS Patching";
    };

    const catalogName = getCatalogName(osType);
    const shortDescription = `${customerName} - ${serverGroup} - ${osType} patching`;

    // Format dates
    const formatDate = (date) =>
      new Date(date).toLocaleString("en-IN", {
        dateStyle: "long",
        timeStyle: "long",
        timeZone: "IST",
      });

    // Generate servers table HTML
    const generateServersTableHTML = (servers) => `
      <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%; margin-top: 15px;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th>Hostname</th>
            <th>IP</th>
            <th>OS</th>
            <th>Managed DBA</th>
          </tr>
        </thead>
        <tbody>
          ${servers
            .map(
              (server) => `
            <tr>
              <td>${server.hostname || ""}</td>
              <td>${server.ip || ""}</td>
              <td>${server.osType || ""}</td>
              <td>${server.mDBA || ""}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `;

    const detailDescription = `
      <p>Hi OS Team,<br><br>
      Please perform the OS Patching activity as per the schedule and also share the prepatch report.</p>
      <p><strong>Customer:</strong> ${customerName}</p>
      <p><strong>Server Group:</strong> ${serverGroup}</p>
      <p><strong>OS Type:</strong> ${osType}</p>
      <p><strong>Start Time:</strong> ${formatDate(start)}</p>
      <p><strong>End Time:</strong> ${formatDate(end)}</p>
      ${generateServersTableHTML(servers)}
    `;

    // ServiceNow request payload
    const requestBody = {
      correlationId: "",
      catalogName: catalogName,
      category: "MHS",
      requested_for: "",
      commonVariables: {
        serviceIdentifier: serviceIdentifier,
        contactMailId: "",
        contactName: "",
        contactNumber: "",
        shortDescription: shortDescription,
        product: "",
        detailDescription: detailDescription,
        multipleServiceIdAffected: "false",
      },
      notes: [],
    };

    // Make ServiceNow API call
    const response = await axios.post(process.env.SN_API_URL, requestBody, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(
          `${process.env.SN_USER}:${process.env.SN_PASSWORD}`
        ).toString("base64")}`,
        XAuthorization: "srmathiv",
        "table-name": "change_request",
      },
    });

    res.status(200).json({
      ticketNumber: response.data.ticketId,
      status: "Created",
    });
  } catch (error) {
    console.error("ServiceNow ticket creation failed:", error);
    res.status(500).json({
      status: "Failed",
      error: error.message,
    });
  }
};
