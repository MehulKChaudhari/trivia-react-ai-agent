import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { FiSend } from "react-icons/fi";
import { FaRobot, FaUser } from "react-icons/fa";

const sessionId = uuidv4();

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const chatEndRef = useRef(null);

  // Auto-scroll chat to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startGame = async () => {
    setGameStarted(true);
    try {
      const response = await axios.get(`http://localhost:5000/start?sessionId=${sessionId}`);
      setMessages([{ sender: "AI", text: response.data.message }]);
    } catch (error) {
      setMessages([{ sender: "AI", text: "Oops! The trivia master is asleep. Try again later." }]);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { sender: "You", text: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await axios.post("http://localhost:5000/ask", {
        sessionId,
        message: input,
      });

      setMessages([...newMessages, { sender: "AI", text: response.data.message }]);
    } catch (error) {
      setMessages([...newMessages, { sender: "AI", text: "Oops! Something went wrong." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col items-center bg-gray-900 text-white">
      {/* HEADER */}
      <div className="w-full max-w-2xl bg-gray-800 p-4 text-center text-xl font-bold shadow-md">
        Trivia AI
      </div>

      {/* WELCOME SCREEN */}
      {!gameStarted ? (
        <div className="w-full max-w-2xl flex-grow flex flex-col justify-center items-center text-center p-6">
          <h2 className="text-2xl font-bold">🎉 Welcome to Snarky Trivia!</h2>
          <p className="mt-4 text-gray-300">
            Think you’re smart? Let’s put that to the test.
            Choose **6 trivia categories** wisely. AI will throw **increasingly harder** questions at you.
          </p>
          <p className="mt-2 text-gray-400">
            Win **5 points** before AI outsmarts you. Can you beat the machine? 🧠💡
          </p>
          <button
            onClick={startGame}
            className="mt-6 px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            Start Game 🚀
          </button>
        </div>
      ) : (
        <>
          {/* CHAT WINDOW */}
          <div className="w-full max-w-2xl flex-grow overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex items-start space-x-3 ${msg.sender === "AI" ? "" : "justify-end"
                  }`}
              >
                {msg.sender === "AI" && <FaRobot className="text-gray-400 mt-1" />}
                <div
                  className={`p-3 rounded-lg max-w-[75%] ${msg.sender === "AI"
                    ? "bg-gray-800 text-gray-300"
                    : "bg-blue-500 text-white"
                    }`}
                >
                  {msg.text}
                </div>
                {msg.sender === "You" && <FaUser className="text-gray-400 mt-1" />}
              </div>
            ))}

            {loading && (
              <div className="flex items-start space-x-3">
                <FaRobot className="text-gray-400 mt-1" />
                <div className="p-3 rounded-lg bg-gray-800 text-gray-300">
                  <span className="animate-pulse">AI is thinking...</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* INPUT BAR */}
          <div className="w-full max-w-2xl p-4 flex bg-gray-800 shadow-md">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-grow p-3 bg-gray-700 text-white rounded-lg outline-none"
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              onClick={sendMessage}
              className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
            >
              <FiSend />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
