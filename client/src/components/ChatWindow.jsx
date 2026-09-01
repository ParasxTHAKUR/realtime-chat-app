import { useEffect, useRef, useState } from "react";
import api from "../api/axios";
import { useSocket } from "../context/useSocket";
import { useAuth } from "../context/useAuth";

function ChatWindow({ otherUser }) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!otherUser) return;
    api.get(`/messages/${otherUser._id}`).then((res) => {
      setMessages(res.data);
    });
  }, [otherUser]);

  useEffect(() => {
    if (!socket) return;

    const handleReceive = (msg) => {
      const isThisConversation =
        msg.sender === otherUser?._id || msg.receiver === otherUser?._id;
      if (isThisConversation) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    const handleTyping = ({ userId }) => {
      if (userId === otherUser?._id) setIsOtherTyping(true);
    };

    const handleStopTyping = ({ userId }) => {
      if (userId === otherUser?._id) setIsOtherTyping(false);
    };

    socket.on("receiveMessage", handleReceive);
    socket.on("userTyping", handleTyping);
    socket.on("userStopTyping", handleStopTyping);

    return () => {
      socket.off("receiveMessage", handleReceive);
      socket.off("userTyping", handleTyping);
      socket.off("userStopTyping", handleStopTyping);
    };
  }, [socket, otherUser]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Reset "is typing" display whenever you switch conversations
  useEffect(() => {
    setIsOtherTyping(false);
  }, [otherUser]);

  const handleTextChange = (e) => {
    setText(e.target.value);

    if (!socket || !otherUser) return;

    socket.emit("typing", { receiverId: otherUser._id });

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", { receiverId: otherUser._id });
    }, 1500);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() || !otherUser) return;

    socket.emit("sendMessage", {
      receiverId: otherUser._id,
      content: text.trim(),
    });
    socket.emit("stopTyping", { receiverId: otherUser._id });
    clearTimeout(typingTimeoutRef.current);
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

      <p style={{ height: "20px", fontSize: "12px", color: "#666" }}>
        {isOtherTyping ? `${otherUser.username} is typing...` : ""}
      </p>

      <form onSubmit={handleSend}>
        <input
          value={text}
          onChange={handleTextChange}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default ChatWindow;
