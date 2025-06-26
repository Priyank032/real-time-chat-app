import React from "react";
import RegisterView from "./views/RegisterView";
import UserListView from "./views/UserListView";
import ChatView from "./views/ChatView";

const ChatUI = ({
  currentView,
  currentUser,
  selectedUser,
  allUsers,
  onlineUsers,
  logs,
  showLogs,
  setShowLogs,
  logout,
  handleRegister,
  isConnected,
  isConnecting,
  setCurrentUser,
  handleSelectUser,
  backToUserList,
  messages,
  message,
  setMessage,
  sendMessage,
  typingUsers,
  handleTyping,
  messagesEndRef,
}) => {
  switch (currentView) {
    case "register":
      return (
        <RegisterView
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          handleRegister={handleRegister}
          isConnecting={isConnecting}
          isConnected={isConnected}
          logs={logs}
          showLogs={showLogs}
          setShowLogs={setShowLogs}
        />
      );
    case "userList":
      return (
        <UserListView
          currentUser={currentUser}
          onlineUsers={onlineUsers}
          allUsers={allUsers}
          showLogs={showLogs}
          setShowLogs={setShowLogs}
          logs={logs}
          logout={logout}
          handleSelectUser={handleSelectUser}
        />
      );
    case "chat":
      return (
        <ChatView
          currentUser={currentUser}
          selectedUser={selectedUser}
          onlineUsers={onlineUsers}
          showLogs={showLogs}
          setShowLogs={setShowLogs}
          backToUserList={backToUserList}
          messages={messages}
          message={message}
          setMessage={setMessage}
          sendMessage={sendMessage}
          typingUsers={typingUsers}
          handleTyping={handleTyping}
          logs={logs}
          messagesEndRef={messagesEndRef}
          handleSelectUser={handleSelectUser}
          allUsers={allUsers}
        />
      );
    default:
      return null;
  }
};

export default ChatUI;
