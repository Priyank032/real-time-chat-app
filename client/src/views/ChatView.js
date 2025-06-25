import React from "react";
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  Button,
  TextField,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { ArrowBack, AccessTime, Message } from "@mui/icons-material";

const ChatView = ({
  currentUser,
  selectedUser,
  onlineUsers,
  showLogs,
  setShowLogs,
  backToUserList,
  messages,
  message,
  setMessage,
  sendMessage,
  typingUsers,
  handleTyping,
  logs,
  messagesEndRef,
}) => {
  return (
    <Box height="100vh" display="flex" flexDirection="column" bgcolor="#f5f5f5">
      <Box maxWidth="900px" margin="auto" display="flex" flexDirection="column" height="100%">
        <Paper elevation={3} sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Chat Header */}
          <Box p={2} borderBottom="1px solid #ddd" display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={2}>
              <IconButton onClick={backToUserList}>
                <ArrowBack />
              </IconButton>
              <Avatar>{selectedUser?.userId.charAt(0).toUpperCase()}</Avatar>
              <Box>
                <Typography variant="h6">{selectedUser?.userId}</Typography>
                <Typography variant="body2" color={selectedUser?.status =="online" ?  "green" : "textSecondary"}>
                  {selectedUser?.status =="online" ? "Online" : "Offline"}
                </Typography>
              </Box>
            </Box>
            <Button onClick={() => setShowLogs(!showLogs)} variant="outlined">
              {showLogs ? "Hide" : "Show"} Logs
            </Button>
          </Box>

          {/* Main Content */}
          <Box flex={1} display="flex" overflow="hidden">
            {/* Message Area */}
            <Box flex={1} display="flex" flexDirection="column">
              <Box p={2} flex={1} overflow="auto">
                {messages.length === 0 ? (
                  <Box textAlign="center" mt={10}>
                    <Message sx={{ fontSize: 48, color: "#ccc" }} />
                    <Typography variant="h6" color="textSecondary">
                      No messages yet
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Start the conversation!
                    </Typography>
                  </Box>
                ) : (
                  <List>
                    {messages.map((msg, index) => (
                      <ListItem
                        key={msg.id || index}
                        sx={{ justifyContent: msg.type === "sent" ? "flex-end" : "flex-start" }}
                      >
                        <Paper
                          sx={{
                            px: 2,
                            py: 1,
                            bgcolor: msg.type === "sent" ? "primary.main" : "grey.300",
                            color: msg.type === "sent" ? "white" : "black",
                          }}
                        >
                          <ListItemText
                            primary={msg.message}
                            secondary={new Date(msg.timestamp).toLocaleTimeString()}
                          />
                        </Paper>
                      </ListItem>
                    ))}

                    {Array.from(typingUsers).map((user) => (
                      <Typography key={user} variant="caption" color="textSecondary">
                        {user} is typing...
                      </Typography>
                    ))}
                    <div ref={messagesEndRef} />
                  </List>
                )}
              </Box>

              <Divider />

              <Box p={2} display="flex" gap={2}>
                <TextField
                  fullWidth
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    handleTyping();
                  }}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type your message..."
                />
                <Button variant="contained" onClick={sendMessage} disabled={!message.trim()}>
                  Send
                </Button>
              </Box>
            </Box>

            {/* Logs */}
            {showLogs && (
              <Box width={300} borderLeft="1px solid #ddd" p={2} overflow="auto">
                <Typography variant="subtitle1" gutterBottom display="flex" alignItems="center">
                  <AccessTime sx={{ mr: 1 }} /> Activity Logs
                </Typography>
                <Box height="100%" overflow="auto">
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

export default ChatView;
