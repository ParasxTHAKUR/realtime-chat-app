import { useEffect, useState } from "react";
import api from "../api/axios";
import { useSocket } from "../context/useSocket";
import { useAuth } from "../context/useAuth";

function ContactList({ onSelectUser, selectedUserId }) {
  const [users, setUsers] = useState([]);
  const { onlineUserIds } = useSocket();
  const { user, logout } = useAuth();

  useEffect(() => {
    api.get("/users").then((res) => {
      setUsers(res.data);
    });
  }, []);

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <span>{user.username}</span>
        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      </div>
      <ul className="contact-list">
        {users.map((u) => (
          <li
            key={u._id}
            onClick={() => onSelectUser(u)}
            className={`contact-item ${selectedUserId === u._id ? "active" : ""}`}
          >
            {u.username}
            <span
              className={`status-dot ${onlineUserIds.includes(u._id) ? "online" : "offline"}`}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ContactList;
