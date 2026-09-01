import { useEffect, useState } from "react";
import api from "../api/axios";
import { useSocket } from "../context/useSocket";

function ContactList({ onSelectUser, selectedUserId }) {
  const [users, setUsers] = useState([]);
  const { onlineUserIds } = useSocket();

  useEffect(() => {
    api.get("/users").then((res) => {
      setUsers(res.data);
    });
  }, []);

  return (
    <div className="sidebar">
      <div className="sidebar-header">Chats</div>
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
