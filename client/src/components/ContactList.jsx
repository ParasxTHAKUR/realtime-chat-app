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
    <ul>
      {users.map((u) => (
        <li
          key={u._id}
          onClick={() => onSelectUser(u)}
          style={{
            fontWeight: selectedUserId === u._id ? "bold" : "normal",
            cursor: "pointer",
          }}
        >
          {u.username} {onlineUserIds.includes(u._id) ? "🟢" : "⚪"}
        </li>
      ))}
    </ul>
  );
}

export default ContactList;
