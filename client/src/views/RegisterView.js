import React from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { Wifi, WifiOff, Message, PersonAdd } from "@mui/icons-material";

const RegisterView = ({
  currentUser,
  setCurrentUser,
  handleRegister,
  isConnecting,
  isConnected,
  logs,
  showLogs,
  setShowLogs,
}) => {
  return (
    <Box
      minHeight="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bgcolor="#f5f5f5"
      p={2}
    >
      <Paper elevation={3} sx={{ p: 4, width: "100%", maxWidth: 400 }}>
        <Box textAlign="center" mb={4}>
          <Message sx={{ fontSize: 48, color: "primary.main" }} />
          <Typography variant="h4" fontWeight="bold">
            Welcome to Chat
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Enter your username to start chatting
          </Typography>
        </Box>

        <TextField
          fullWidth
          label="Choose your username"
          value={currentUser}
          onChange={(e) => setCurrentUser(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && !isConnecting && handleRegister()}
          disabled={isConnecting}
          sx={{ mb: 3 }}
        />

        <Button
          fullWidth
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={handleRegister}
          disabled={!currentUser.trim() || isConnecting}
        >
          {isConnecting ? <CircularProgress size={24} /> : "Join Chat"}
        </Button>

        <Box mt={2} display="flex" justifyContent="center" alignItems="center">
          {isConnected ? (
            <Box display="flex" alignItems="center" color="green">
              <Wifi sx={{ mr: 1 }} /> Connected
            </Box>
          ) : isConnecting ? (
            <Box display="flex" alignItems="center" color="orange">
              <CircularProgress size={14} sx={{ mr: 1 }} /> Connecting...
            </Box>
          ) : (
            <Box display="flex" alignItems="center" color="red">
              <WifiOff sx={{ mr: 1 }} /> Disconnected
            </Box>
          )}
        </Box>

        {logs.length > 0 && (
          <Box mt={2}>
            <Button
              onClick={() => setShowLogs(!showLogs)}
              size="small"
              color="primary"
            >
              {showLogs ? "Hide" : "Show"} Connection Logs
            </Button>

            {showLogs && (
              <Box
                mt={1}
                p={1}
                height={100}
                bgcolor="#eee"
                borderRadius={1}
                overflow="auto"
              >
                {logs.slice(-10).map((log, index) => (
                  <Typography
                    key={index}
                    variant="caption"
                    color={
                      log.type === "error"
                        ? "error"
                        : log.type === "success"
                        ? "green"
                        : log.type === "system"
                        ? "primary"
                        : "textSecondary"
                    }
                  >
                    [{log.timestamp}] {log.message}
                  </Typography>
                ))}
              </Box>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default RegisterView;
