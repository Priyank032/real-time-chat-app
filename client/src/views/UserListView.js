import React from "react";
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  Paper,
  Button,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  Badge,
} from "@mui/material";
import {
  Logout,
  Message,
  AccessTime,
  Refresh,
  FiberManualRecord,
  PersonOutline,
} from "@mui/icons-material";

const UserListView = ({
  currentUser,
  allUsers,
  onlineUsers,
  handleSelectUser,
  logout,
  logs,
  showLogs,
  setShowLogs,
  refreshUserList,
}) => {
  // Helper function to format last seen time
  const formatLastSeen = (timestamp) => {
    const now = new Date();
    const lastSeen = new Date(timestamp);
    console.log(now, "now");
    console.log(lastSeen, "lastSeen");
    const diffInMinutes = Math.floor((now - lastSeen) / (1000 * 60));
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Helper function to get status color
  const getStatusColor = (status) => {
    return status === "online" ? "#4caf50" : "#9e9e9e";
  };

  // Helper function to get status text
  const getStatusText = (user) => {
    if (user.status === "online") {
      return "Online";
    }
    if (user.lastSeen) {
      return `Last seen ${formatLastSeen(user.lastSeen)}`;
    }
    return "";
  };
  console.log(allUsers, "allUsers");
  const onlineCount = allUsers.filter(
    (user) => user.status === "online"
  ).length;
  const totalUsers = allUsers.length;

  return (
    <Box minHeight="100vh" bgcolor="#f5f5f5" p={3}>
      <Box maxWidth="600px" margin="auto">
        <Paper elevation={3}>
          <Box
            p={3}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Typography variant="h5">Welcome, {currentUser}</Typography>
              <Box display="flex" alignItems="center" gap={1} mt={1}>
                <Chip
                  size="small"
                  label={`${onlineCount} Online`}
                  color="success"
                  variant="outlined"
                />
                <Chip
                  size="small"
                  label={`${totalUsers} Total`}
                  color="default"
                  variant="outlined"
                />
              </Box>
            </Box>
            <Box display="flex" gap={1}>
              <IconButton
                onClick={refreshUserList}
                color="primary"
                title="Refresh user list"
              >
                <Refresh />
              </IconButton>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Logout />}
                onClick={logout}
              >
                Logout
              </Button>
            </Box>
          </Box>

          <Divider />

          <Box p={3}>
            <Typography variant="h6" gutterBottom>
              Select a user to chat
            </Typography>

            {totalUsers === 0 ? (
              <Box textAlign="center" py={4}>
                <PersonOutline sx={{ fontSize: 60, color: "#ccc", mb: 2 }} />
                <Typography color="textSecondary">
                  No other users found
                </Typography>
                <Button
                  onClick={refreshUserList}
                  variant="outlined"
                  sx={{ mt: 2 }}
                  startIcon={<Refresh />}
                >
                  Refresh
                </Button>
              </Box>
            ) : (
              <List>
                {allUsers.map((user) => (
                  <ListItem
                    button
                    key={user.userId}
                    onClick={() => handleSelectUser(user)}
                    sx={{
                      mb: 1,
                      borderRadius: 1,
                      "&:hover": { backgroundColor: "#eee" },
                      opacity: user.status === "offline" ? 0.7 : 1,
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{
                          vertical: "bottom",
                          horizontal: "right",
                        }}
                        badgeContent={
                          <FiberManualRecord
                            sx={{
                              color: getStatusColor(user.status),
                              fontSize: 12,
                            }}
                          />
                        }
                      >
                        <Avatar
                          sx={{
                            bgcolor:
                              user.status === "online" ? "#1976d2" : "#9e9e9e",
                          }}
                        >
                          {user.userId.charAt(0).toUpperCase()}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body1">{user.userId}</Typography>
                          {user.status === "online" && (
                            <Chip
                              size="small"
                              label="Online"
                              color="success"
                              variant="outlined"
                              sx={{ height: 20, fontSize: 10 }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Typography
                          variant="body2"
                          color={
                            user.status === "online"
                              ? "success.main"
                              : "text.secondary"
                          }
                        >
                          {getStatusText(user)}
                        </Typography>
                      }
                    />
                    <Message
                      sx={{
                        color: user.status === "online" ? "#1976d2" : "#9e9e9e",
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            )}

            <Box
              mt={3}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Button onClick={() => setShowLogs(!showLogs)} variant="text">
                {showLogs ? "Hide Logs" : "Show Logs"}
              </Button>
              <Typography variant="caption" color="text.secondary">
                Last updated: {new Date().toLocaleTimeString()}
              </Typography>
            </Box>

            {showLogs && (
              <Box
                mt={2}
                p={2}
                border="1px solid #ddd"
                borderRadius={2}
                bgcolor="#fafafa"
              >
                <Typography
                  variant="subtitle1"
                  display="flex"
                  alignItems="center"
                >
                  <AccessTime sx={{ mr: 1 }} /> Activity Logs
                </Typography>
                <Box mt={1} maxHeight={200} overflow="auto">
                  {logs.map((log, index) => (
                    <Typography
                      key={index}
                      variant="body2"
                      color={
                        log.type === "error"
                          ? "error"
                          : log.type === "success"
                          ? "green"
                          : log.type === "message"
                          ? "blue"
                          : log.type === "sent"
                          ? "orange"
                          : "textSecondary"
                      }
                    >
                      [{log.timestamp}] {log.message}
                    </Typography>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default UserListView;
