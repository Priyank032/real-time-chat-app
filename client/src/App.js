import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import ChatUI from "./ChatUI";

const ChatApp = () => {
  const [socket, setSocket] = useState(null);
  const [currentUser, setCurrentUser] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [allUsers, setAllUsers] = useState([]); // All users with status
  const [onlineUsers, setOnlineUsers] = useState([]); // Only online users
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [logs, setLogs] = useState([]);
  const [currentView, setCurrentView] = useState("register");
  const [showLogs, setShowLogs] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const addLog = (type, message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev.slice(-19), { type, message, timestamp }]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Helper function to update user in the lists
  const updateUserInList = (userInfo) => {
    setAllUsers((prev) => {
      const filteredUsers = prev.filter((u) => u.userId !== userInfo.userId);
      return [...filteredUsers, userInfo].sort((a, b) => a.userId.localeCompare(b.userId));
    });

    if (userInfo.status === 'online') {
      setOnlineUsers((prev) => {
        const filteredUsers = prev.filter((u) => u.userId !== userInfo.userId && u.userId !== currentUser);
        return [...filteredUsers, userInfo];
      });
    } else {
      setOnlineUsers((prev) => prev.filter((u) => u.userId !== userInfo.userId));
    }
  };

  const connectToServer = () => {
    return new Promise((resolve, reject) => {
      if (socket) socket.disconnect();
      setIsConnecting(true);
      addLog("system", "Attempting to connect to server...");
      const newSocket = io("http://localhost:3001", {
        timeout: 5000,
        forceNew: true,
      });
      setSocket(newSocket);

      newSocket.on("connect", () => {
        setIsConnected(true);
        addLog("system", "Connected to server");
        resolve(newSocket);
      });

      newSocket.on("connect_error", (error) => {
        setIsConnected(false);
        setIsConnecting(false);
        addLog("error", `Connection failed: ${error.message}`);
        reject(error);
      });

      newSocket.on("disconnect", (reason) => {
        setIsConnected(false);
        setIsRegistered(false);
        setIsConnecting(false);
        addLog("system", `Disconnected from server: ${reason}`);
        setCurrentView("register");
        setAllUsers([]);
        setOnlineUsers([]);
      });

      newSocket.on("registered", (userInfo) => {
        setIsRegistered(true);
        setIsConnecting(false);
        setCurrentView("userList");
        addLog("success", `Registered as ${userInfo.userId} (${userInfo.status})`);
        // Request all users to get the complete list with status
        newSocket.emit("getAllUsers");
      });

      // Handle all users list (with status)
      newSocket.on("allUsers", (users) => {
        const otherUsers = users.filter((u) => u.userId !== currentUser);
        setAllUsers(otherUsers);
        
        const onlineOthers = otherUsers.filter((u) => u.status === 'online');
        setOnlineUsers(onlineOthers);
        
        addLog("info", `Total users: ${users.length}, Online: ${onlineOthers.length + 1}`);
      });

      // Handle online users list (backward compatibility)
      newSocket.on("onlineUsers", (users) => {
        if (Array.isArray(users) && typeof users[0] === 'string') {
          // Old format - just usernames
          const userObjects = users
            .filter((u) => u !== currentUser)
            .map((userId) => ({ userId, status: 'online', lastSeen: new Date().toISOString() }));
          setOnlineUsers(userObjects);
        } else {
          // New format - user objects with status
          const onlineOthers = users.filter((u) => u.userId !== currentUser && u.status === 'online');
          setOnlineUsers(onlineOthers);
        }
        addLog("info", `Online users updated`);
      });

      // Handle real-time user status updates
      newSocket.on("userStatusUpdate", (userInfo) => {
        updateUserInList(userInfo);
        addLog("info", `${userInfo.userId} is now ${userInfo.status}`);
      });

      newSocket.on("userJoined", (userInfo) => {
        updateUserInList(userInfo);
        addLog("info", `${userInfo.userId} joined the chat`);
      });

      newSocket.on("userLeft", (userInfo) => {
        updateUserInList(userInfo);
        addLog("info", `${userInfo.userId} left the chat (now offline)`);
      });

      newSocket.on("message", (msg) => {
        setMessages((prev) => [...prev, { ...msg, type: "received" }]);
        addLog("message", `Message from ${msg.from}: ${msg.message}`);
      });

      newSocket.on("messageAck", () => {
        addLog("success", `Message delivered`);
      });

      newSocket.on("userTyping", (data) => {
        if (data.userId === selectedUser) {
          setTypingUsers((prev) => new Set([...prev, data.userId]));
          setTimeout(() => {
            setTypingUsers((prev) => {
              const newSet = new Set(prev);
              newSet.delete(data.userId);
              return newSet;
            });
          }, 3000);
        }
      });

      setTimeout(() => {
        if (!newSocket.connected) {
          setIsConnecting(false);
          addLog("error", "Connection timeout");
          reject(new Error("Connection timeout"));
        }
      }, 10000);
    });
  };

  const handleRegister = async () => {
    if (!currentUser.trim()) return addLog("error", "Please enter a username");
    try {
      const connectedSocket = await connectToServer();
      setTimeout(() => {
        if (connectedSocket.connected) {
          addLog("system", `Registering user: ${currentUser.trim()}`);
          connectedSocket.emit("register", currentUser.trim());
        }
      }, 500);
    } catch (error) {
      setIsConnecting(false);
      addLog("error", `Failed to connect: ${error.message}`);
    }
  };

  const handleSelectUser = (userObj) => {
    const userId = typeof userObj === 'string' ? userObj : userObj.userId;
    setSelectedUser(userObj);
    setCurrentView("chat");
    setMessages([]);
    addLog("info", `Started chat with ${userId}`);
    fetchChatHistory(userId);
  };

  const sendMessage = () => {
    if (socket && message.trim() && selectedUser) {
      const messageData = {
        from: currentUser,
        to: selectedUser,
        message: message.trim(),
      };
      socket.emit("sendMessage", messageData);
      setMessages((prev) => [
        ...prev,
        {
          ...messageData,
          type: "sent",
          timestamp: new Date().toISOString(),
          id: Date.now(),
        },
      ]);
      addLog("sent", `Sent: ${message.trim()}`);
      setMessage("");
    }
  };

  const handleTyping = () => {
    if (socket && selectedUser) {
      socket.emit("typing", { from: currentUser, to: selectedUser });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stopTyping", { from: currentUser, to: selectedUser });
      }, 1000);
    }
  };

  const fetchChatHistory = async (targetUser) => {
    try {
      const res = await fetch(`http://localhost:3001/messages?user1=${currentUser}&user2=${targetUser}`);
      const data = await res.json();
      const formattedMessages = data.messages.map((msg) => ({
        ...msg,
        type: msg.from === currentUser ? "sent" : "received",
      }));
      setMessages(formattedMessages);
      if (data.totalMessages > 0)
        addLog("success", `Loaded ${data.totalMessages} messages`);
    } catch {
      addLog("error", "Failed to fetch chat history");
    }
  };

  const logout = () => {
    if (socket) socket.disconnect();
    setCurrentUser("");
    setSelectedUser("");
    setMessages([]);
    setAllUsers([]);
    setOnlineUsers([]);
    setIsConnected(false);
    setIsRegistered(false);
    setIsConnecting(false);
    setCurrentView("register");
    addLog("system", "Logged out");
  };

  const backToUserList = () => {
    setCurrentView("userList");
    setSelectedUser("");
    setMessages([]);
  };

  const refreshUserList = () => {
    if (socket && socket.connected) {
      socket.emit("getAllUsers");
      addLog("system", "Refreshing user list...");
    }
  };

  return (
    <ChatUI
      currentView={currentView}
      currentUser={currentUser}
      selectedUser={selectedUser}
      allUsers={allUsers}
      onlineUsers={onlineUsers}
      logs={logs}
      showLogs={showLogs}
      setShowLogs={setShowLogs}
      logout={logout}
      handleRegister={handleRegister}
      isConnected={isConnected}
      isConnecting={isConnecting}
      setCurrentUser={setCurrentUser}
      handleSelectUser={handleSelectUser}
      backToUserList={backToUserList}
      messages={messages}
      message={message}
      setMessage={setMessage}
      sendMessage={sendMessage}
      typingUsers={typingUsers}
      handleTyping={handleTyping}
      messagesEndRef={messagesEndRef}
      refreshUserList={refreshUserList}
    />
  );
};

export default ChatApp;