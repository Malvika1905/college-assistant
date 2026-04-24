import { useState } from "react";
import axios from "axios";

function App() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [file, setFile] = useState(null);

  // 📌 SEND MESSAGE
  const sendMessage = async () => {
    try {
      if (!message) return;

      const res = await axios.post("http://localhost:5000/chat", {
        message,
      });

      setChat((prev) => [...prev, { user: message, bot: res.data.reply }]);
      setMessage("");
    } catch (error) {
      console.error("Chat error:", error.response?.data || error);

      // 🔥 SHOW REAL ERROR
      alert(
        error.response?.data?.error || "Chat failed ❌ (check upload first)"
      );
    }
  };

  // 📌 UPLOAD FILE
  const uploadFile = async () => {
    try {
      if (!file) {
        alert("Please select a PDF first ❗");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      console.log("Uploading file:", file);

      const res = await axios.post(
        "http://localhost:5000/chat/upload",
        formData
        // ❌ DO NOT manually set Content-Type (axios handles it)
      );

      console.log("Upload response:", res.data);

      alert(res.data.message || "PDF uploaded successfully ✅");
    } catch (error) {
      console.error("Upload error:", error.response?.data || error);

      // 🔥 SHOW EXACT BACKEND ERROR
      alert(error.response?.data?.error || "Upload failed ❌");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>AI College Assistant 🤖</h1>

      {/* 📌 Upload Section */}
      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => {
          const selectedFile = e.target.files[0];
          console.log("Selected file:", selectedFile);
          setFile(selectedFile);
        }}
      />
      <button onClick={uploadFile}>Upload PDF</button>

      <hr />

      {/* 📌 Chat Section */}
      <div>
        {chat.map((c, i) => (
          <div key={i}>
            <p><b>You:</b> {c.user}</p>
            <p><b>Bot:</b> {c.bot}</p>
          </div>
        ))}
      </div>

      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Ask something..."
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default App;