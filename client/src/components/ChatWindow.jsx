import { useEffect, useRef, useState } from "react";
import api from "../api/axios";
import { useSocket } from "../context/useSocket";
import { useAuth } from "../context/useAuth";

function ChatWindow({ otherUser }) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  // Load history whenever the selected conversation changes
  useEffect(() => {
    if (!otherUser) return;

    api.get(`/messages/${otherUser._id}`).then((res) => {
      setMessages(res.data);
    });
  }, [otherUser]);

  // Listen for live incoming messages
  useEffect(() => {
    if (!socket) return;

    const handleReceive = (msg) => {
      const isThisConversation =
        msg.sender === otherUser?._id || msg.receiver === otherUser?._id;
      if (isThisConversation) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on("receiveMessage", handleReceive);

    return () => {
      socket.off("receiveMessage", handleReceive);
    };
  }, [socket, otherUser]);

  // Auto-scroll to the latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() || !otherUser) return;

    socket.emit("sendMessage", {
      receiverId: otherUser._id,
      content: text.trim(),
    });
    setText("");
  };

  if (!otherUser) {
    return <p>Select a user to start chatting</p>;
  }

  return (
    <div>
      <h2>Chatting with {otherUser.username}</h2>

      <div
        style={{ height: "300px", overflowY: "auto", border: "1px solid #ccc" }}
      >
        {messages.map((m) => (
          <p
            key={m._id}
            style={{ textAlign: m.sender === user._id ? "right" : "left" }}
          >
            {m.content}
          </p>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default ChatWindow;
