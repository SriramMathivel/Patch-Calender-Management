import React, { useState, useEffect } from "react";
import {
  Accordion,
  Alert,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Paper,
  Button,
  Snackbar,
  IconButton,
  Box,
  CircularProgress,
  Autocomplete,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";

const ManageServer = () => {
  const [servers, setServers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [expandedGroup, setExpandedGroup] = useState("");
  const [editingServer, setEditingServer] = useState(null);
  const [addingNew, setAddingNew] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [loading, setLoading] = useState(true);
  const [deletingGroup, setDeletingGroup] = useState(null);
  const [showNewGroupDialog, setShowNewGroupDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  const [formData, setFormData] = useState({
    CID: "",
    CUID: "",
    customerName: "",
    name: "",
    hostname: "",
    ip: "",
    serverGroup: "",
    osType: "",
    mDBA: "No",
    customerMailID: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchServers();
  }, []);

  const fetchServers = async () => {
    try {
      const response = await fetch("/api/servers");
      const data = await response.json();
      setServers(data.data);

      const customers = [...new Set(data.data.map((s) => s.customerName))].sort(
        (a, b) => a.localeCompare(b)
      );

      if (customers.length > 0) {
        setSelectedCustomer(customers[0]);
      }
      setLoading(false);
    } catch (error) {
      showNotification("Failed to fetch servers", "error");
      setLoading(false);
    }
  };

  const groupServers = (servers) => {
    const groups = servers.reduce((acc, server) => {
      const group = server.serverGroup || "Ungrouped";
      if (!acc[group]) acc[group] = [];
      acc[group].push(server);
      return acc;
    }, {});

    if (addingNew && formData.serverGroup && !groups[formData.serverGroup]) {
      groups[formData.serverGroup] = [];
    }

    return groups;
  };

  const validateForm = () => {
    const newErrors = {};
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.CID) newErrors.CID = "CID required";
    if (!formData.name) newErrors.name = "Name required";
    if (!formData.hostname) newErrors.hostname = "Hostname required";
    if (!ipRegex.test(formData.ip)) newErrors.ip = "Invalid IP";
    if (!formData.osType) newErrors.osType = "OS Type required";
    if (!emailRegex.test(formData.customerMailID))
      newErrors.customerMailID = "Invalid email";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const method = editingServer ? "PUT" : "POST";
      const url = editingServer
        ? `/api/servers/${formData.CID}`
        : "/api/servers";

      const customerServer = servers.find(
        (s) => s.customerName === selectedCustomer
      );
      const payload = {
        ...formData,
        CUID: customerServer?.CUID || "",
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(await response.text());

      await fetchServers();
      cancelEdit();
      showNotification(
        `Server ${editingServer ? "updated" : "added"} successfully`,
        "success"
      );
    } catch (error) {
      showNotification(error.message || "Operation failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (server) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/servers/${server.CID}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Delete failed");

      await fetchServers();
      showNotification("Server deleted successfully", "success");
    } catch (error) {
      showNotification(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (group) => {
    setLoading(true);
    try {
      const serversToDelete = servers.filter(
        (s) => s.customerName === selectedCustomer && s.serverGroup === group
      );
      const deletePromises = serversToDelete.map((server) =>
        fetch(`/api/servers/${server.CID}`, { method: "DELETE" })
      );

      const results = await Promise.allSettled(deletePromises);
      const failedDeletes = results.filter(
        (result) => result.status === "rejected"
      );

      if (failedDeletes.length > 0) {
        throw new Error(
          `Failed to delete ${failedDeletes.length} servers in the group`
        );
      }

      showNotification(`Group "${group}" deleted successfully`, "success");
    } catch (error) {
      showNotification(error.message || "Failed to delete group", "error");
    } finally {
      await fetchServers();
      setLoading(false);
    }
  };

  const startEdit = (server) => {
    setEditingServer(server.CID);
    setFormData(server);
    setErrors({});
  };

  const startAdd = (group) => {
    const customerServer = servers.find(
      (s) => s.customerName === selectedCustomer
    );
    setAddingNew(true);
    setFormData({
      CID: "",
      CUID: customerServer?.CUID || "",
      customerName: selectedCustomer,
      name: "",
      hostname: "",
      ip: "",
      serverGroup: group,
      osType: "",
      mDBA: "No",
      customerMailID: "",
    });
    setExpandedGroup(group);
    setErrors({});
  };

  const cancelEdit = () => {
    setEditingServer(null);
    setAddingNew(false);
    setFormData({
      CID: "",
      CUID: "",
      customerName: "",
      name: "",
      hostname: "",
      ip: "",
      serverGroup: "",
      osType: "",
      mDBA: "No",
      customerMailID: "",
    });
  };

  const showNotification = (message, severity) => {
    setNotification({ open: true, message, severity });
  };

  const customers = [
    ...new Set(servers.map((server) => server.customerName)),
  ].sort((a, b) => a.localeCompare(b));
  const filteredServers = servers.filter(
    (server) => server.customerName === selectedCustomer
  );
  const groupedServers = groupServers(filteredServers);

  if (loading)
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h5">Manage Servers</Typography>
        <Autocomplete
          options={customers}
          value={selectedCustomer}
          onChange={(e, newValue) => setSelectedCustomer(newValue)}
          sx={{ width: 500 }}
          disableClearable
          renderInput={(params) => (
            <TextField
              {...params}
              label="Select Customer"
              size="small"
              sx={{ backgroundColor: "#ffffff" }}
              required
            />
          )}
        />
      </Box>

      {Object.keys(groupedServers)
        .sort()
        .map((group) => (
          <Accordion
            key={group}
            expanded={expandedGroup === group}
            onChange={(e, isExpanded) =>
              setExpandedGroup(isExpanded ? group : "")
            }
            sx={{ mb: 1 }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{ bgcolor: "#f5f5f5" }}
            >
              <Typography variant="subtitle1">{group}</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <Box
                sx={{
                  p: 1,
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 1,
                }}
              >
                <Button
                  startIcon={<AddIcon />}
                  size="small"
                  onClick={() => startAdd(group)}
                  disabled={!!editingServer || addingNew}
                  sx={{ mb: 1 }}
                >
                  Add Server
                </Button>
                <Button
                  startIcon={<DeleteIcon />}
                  size="small"
                  color="error"
                  onClick={() => setDeletingGroup(group)}
                  disabled={!!editingServer || addingNew}
                  sx={{ mb: 1 }}
                >
                  Delete Group
                </Button>
              </Box>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>CID</TableCell>
                      <TableCell>VM Name</TableCell>
                      <TableCell>Hostname</TableCell>
                      <TableCell>IP Address</TableCell>
                      <TableCell>OS Type</TableCell>
                      <TableCell>Managed DBA</TableCell>
                      <TableCell>Customer Email</TableCell>
                      <TableCell width={120}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {addingNew && formData.serverGroup === group && (
                      <TableRow>
                        <TableCell>
                          <TextField
                            value={formData.CID}
                            onChange={(e) =>
                              setFormData({ ...formData, CID: e.target.value })
                            }
                            size="small"
                            error={!!errors.CID}
                            helperText={errors.CID}
                            placeholder="New CID"
                            required
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            value={formData.name}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                name: e.target.value,
                              })
                            }
                            size="small"
                            error={!!errors.name}
                            helperText={errors.name}
                            required
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            value={formData.hostname}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                hostname: e.target.value,
                              })
                            }
                            size="small"
                            error={!!errors.hostname}
                            helperText={errors.hostname}
                            required
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            value={formData.ip}
                            onChange={(e) =>
                              setFormData({ ...formData, ip: e.target.value })
                            }
                            size="small"
                            error={!!errors.ip}
                            helperText={errors.ip}
                            required
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            value={formData.osType}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                osType: e.target.value,
                              })
                            }
                            size="small"
                            error={!!errors.osType}
                            helperText={errors.osType}
                            required
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            select
                            value={formData.mDBA}
                            onChange={(e) =>
                              setFormData({ ...formData, mDBA: e.target.value })
                            }
                            size="small"
                            SelectProps={{ native: true }}
                          >
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </TextField>
                        </TableCell>
                        <TableCell>
                          <TextField
                            value={formData.customerMailID}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                customerMailID: e.target.value,
                              })
                            }
                            size="small"
                            error={!!errors.customerMailID}
                            helperText={errors.customerMailID}
                            required
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton onClick={handleSave} size="small">
                            <SaveIcon />
                          </IconButton>
                          <IconButton onClick={cancelEdit} size="small">
                            <CloseIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    )}
                    {(groupedServers[group] || []).map((server) => (
                      <TableRow key={server.CID} hover>
                        {editingServer === server.CID ? (
                          <>
                            <TableCell>
                              <TextField
                                value={formData.CID}
                                size="small"
                                error={!!errors.CID}
                                helperText={errors.CID}
                                disabled
                                sx={{ backgroundColor: "#f5f5f5" }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                value={formData.name}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    name: e.target.value,
                                  })
                                }
                                size="small"
                                error={!!errors.name}
                                helperText={errors.name}
                                required
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                value={formData.hostname}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    hostname: e.target.value,
                                  })
                                }
                                size="small"
                                error={!!errors.hostname}
                                helperText={errors.hostname}
                                required
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                value={formData.ip}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    ip: e.target.value,
                                  })
                                }
                                size="small"
                                error={!!errors.ip}
                                helperText={errors.ip}
                                required
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                value={formData.osType}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    osType: e.target.value,
                                  })
                                }
                                size="small"
                                error={!!errors.osType}
                                helperText={errors.osType}
                                required
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                select
                                value={formData.mDBA}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    mDBA: e.target.value,
                                  })
                                }
                                size="small"
                                SelectProps={{ native: true }}
                              >
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                              </TextField>
                            </TableCell>
                            <TableCell>
                              <TextField
                                value={formData.customerMailID}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    customerMailID: e.target.value,
                                  })
                                }
                                size="small"
                                error={!!errors.customerMailID}
                                helperText={errors.customerMailID}
                                required
                              />
                            </TableCell>
                            <TableCell>
                              <IconButton onClick={handleSave} size="small">
                                <SaveIcon />
                              </IconButton>
                              <IconButton onClick={cancelEdit} size="small">
                                <CloseIcon />
                              </IconButton>
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell>{server.CID}</TableCell>
                            <TableCell>{server.name}</TableCell>
                            <TableCell>{server.hostname}</TableCell>
                            <TableCell>{server.ip}</TableCell>
                            <TableCell>{server.osType}</TableCell>
                            <TableCell>{server.mDBA}</TableCell>
                            <TableCell>{server.customerMailID}</TableCell>
                            <TableCell>
                              <IconButton
                                onClick={() => startEdit(server)}
                                size="small"
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                onClick={() => handleDelete(server)}
                                size="small"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        ))}

      <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
        <Button
          startIcon={<AddIcon />}
          variant="outlined"
          onClick={() => setShowNewGroupDialog(true)}
        >
          Create New Group
        </Button>
      </Box>

      {/* Delete Group Confirmation Dialog */}
      <Dialog
        open={Boolean(deletingGroup)}
        onClose={() => setDeletingGroup(null)}
      >
        <DialogTitle>Delete Group</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the entire group "{deletingGroup}"?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletingGroup(null)}>Cancel</Button>
          <Button
            onClick={() => {
              handleDeleteGroup(deletingGroup);
              setDeletingGroup(null);
            }}
            color="error"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create New Group Dialog */}
      <Dialog
        open={showNewGroupDialog}
        onClose={() => setShowNewGroupDialog(false)}
      >
        <DialogTitle>Create New Group</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Group Name"
            fullWidth
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNewGroupDialog(false)}>Cancel</Button>
          <Button
            onClick={() => {
              if (newGroupName.trim()) {
                startAdd(newGroupName.trim());
                setShowNewGroupDialog(false);
                setNewGroupName("");
              }
            }}
            color="primary"
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert
          variant="filled"
          severity={notification.severity}
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ManageServer;
