import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/useAuth";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ContactList from "./components/ContactList";
import ChatWindow from "./components/ChatWindow";

function ChatPage() {
  const [selectedUser, setSelectedUser] = useState(null);

  return (
    <div style={{ display: "flex" }}>
      <ContactList
        onSelectUser={setSelectedUser}
        selectedUserId={selectedUser?._id}
      />
      <ChatWindow otherUser={selectedUser} />
    </div>
  );
}

function App() {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route
          path="/register"
          element={user ? <Navigate to="/" /> : <Register />}
        />
        <Route
          path="/"
          element={user ? <ChatPage /> : <Navigate to="/login" />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
