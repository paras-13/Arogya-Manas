import React, { useState, useEffect, useRef } from "react";
import api from "../../api";

// -------------------------------- Icons --------------------------------

const SendIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    className="text-white"
  >
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2 .01 7z" fill="currentColor" />
  </svg>
);

const UserIcon = () => (
  <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

const AuraIcon = () => (
  <svg
    className="h-6 w-6 text-blue-600"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <circle cx="9" cy="9" r="1" />
    <circle cx="15" cy="9" r="1" />
  </svg>
);

// -------------------------------- Chat Bubble --------------------------------

const MessageBubble = ({ text, sender }) => {
  const isUser = sender === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex items-start gap-3 px-4 py-3 rounded-2xl max-w-xs shadow-sm ${
          isUser
            ? "bg-blue-600 text-white rounded-br-none"
            : "bg-gray-100 text-gray-800 rounded-bl-none"
        }`}
      >
        <div
          className={`h-8 w-8 rounded-full flex items-center justify-center ${
            isUser ? "bg-blue-700" : "bg-gray-200"
          }`}
        >
          {isUser ? <UserIcon /> : <AuraIcon />}
        </div>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
      </div>
    </div>
  );
};

const LoadingBubble = () => (
  <div className="flex justify-start">
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gray-100 rounded-bl-none shadow-sm">
      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
        <AuraIcon />
      </div>

      <div className="flex space-x-1.5">
        <div className="h-2 w-2 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
        <div className="h-2 w-2 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
        <div className="h-2 w-2 bg-gray-500 rounded-full animate-pulse"></div>
      </div>
    </div>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ArogyaMitraAIChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const [activeTab, setActiveTab] = useState("chat"); // "chat" | "summaries"

  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [filterValue, setFilterValue] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);

  const chatRef = useRef(null);

  const hasActiveSession = messages.length > 0;

  // ---------------- Load Chat History ----------------
  const loadHistory = async () => {
    try {
      const res = await api.get("/ai_assist/history/");
      const historyMsgs = res.data.history.map((msg) => ({
        id: msg.id,
        text: msg.content,
        sender: msg.sender,
      }));
      setMessages(historyMsgs);
    } catch (err) {
      console.error("History Load Error:", err);
    }
  };

  // ---------------- Load Session Reports ----------------
  const loadReports = async () => {
    try {
      setReportsLoading(true);
      const res = await api.get("/ai_assist/reports/");
      const list = res.data.reports || [];
      setReports(list);
      if (!selectedReport && list.length > 0) {
        setSelectedReport(list[0]);
      }
    } catch (err) {
      console.error("Reports Load Error:", err);
    } finally {
      setReportsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (activeTab === "summaries") {
      loadReports();
    }
  }, [activeTab]);

  // Chat auto-scroll (inside chat box only)
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // ---------------- Send Message ----------------
  const sendMsg = async (e) => {
    e.preventDefault();

    if (!inputValue.trim()) return;
    if (isLoading || isEnding || isGeneratingSummary) return;

    const text = inputValue.trim();

    setMessages((prev) => [...prev, { id: Date.now(), text, sender: "user" }]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await api.post("/ai_assist/chat/", { message: text });
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, text: res.data.reply, sender: "ai" },
      ]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: "AI error. Please try later.",
          sender: "ai",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------- End Session ----------------
  const endSession = async () => {
    if (!hasActiveSession) {
      alert("No active session to end.");
      return;
    }

    if (!window.confirm("Are you sure you want to end this session?")) return;

    setIsEnding(true);
    setIsGeneratingSummary(true);

    try {
      await api.post("/ai_assist/end/");

      setMessages([]);
      setInput("");

      setActiveTab("summaries");
      await loadReports();

      alert("Session ended and summary saved.");
    } catch (error) {
      console.error("End Session Error:", error);
      alert("Could not end session. Try again later.");
    } finally {
      setIsEnding(false);
      setIsGeneratingSummary(false);
    }
  };

  // ---------------- Filtered Reports ----------------
  const filteredReports = reports.filter((r) => {
    if (!filterValue.trim()) return true;
    const term = filterValue.toLowerCase();
    const summaryText = JSON.stringify(r.summary || {}).toLowerCase();
    const dateText = new Date(r.created_at).toLocaleString().toLowerCase();
    const nameText = (r.session_name || "").toLowerCase();
    return (
      summaryText.includes(term) ||
      dateText.includes(term) ||
      nameText.includes(term)
    );
  });

  // ---------------- Rename Session ----------------
  const renameSession = async () => {
    if (!selectedReport) return;

    const newName = (selectedReport.session_name || "").trim();
    if (!newName) {
      alert("Session name cannot be empty.");
      return;
    }

    try {
      await api.post(`/ai_assist/rename/${selectedReport.id}/`, {
        name: newName,
      });
      alert("Session renamed successfully.");
      await loadReports();
    } catch (error) {
      console.error("Rename Error:", error);
      alert("Could not rename session. Try again later.");
    }
  };

  // ---------------- Summary Detail ----------------
  const renderSummaryDetail = () => {
    if (!selectedReport) {
      return (
        <div className="h-full flex items-center justify-center text-gray-400">
          Select a session from the left to view its summary.
        </div>
      );
    }

    const { summary } = selectedReport || {};
    const s = summary || {};

    return (
      <div className="h-full flex flex-col">
        {/* Session name + rename */}
        <div className="p-4 border-b bg-white flex items-center gap-2">
          <input
            type="text"
            value={selectedReport.session_name || ""}
            onChange={(e) =>
              setSelectedReport({
                ...selectedReport,
                session_name: e.target.value,
              })
            }
            className="flex-1 px-3 py-2 border rounded text-sm"
            placeholder="Session name"
          />
          <button
            onClick={renameSession}
            className="px-3 py-2 bg-blue-600 text-white rounded text-sm"
          >
            Save
          </button>
        </div>

        {/* Scrollable summary content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          <SummaryCard
            title="What the user talked about"
            text={s.user_discussion}
          />
          <SummaryCard title="Emotions expressed" text={s.emotions_expressed} />
          <SummaryCard
            title="How the assistant supported"
            text={s.assistant_support}
          />
          <SummaryCard title="Conversation tone" text={s.conversation_tone} />

          <div className="bg-blue-50 border border-blue-100 rounded-xl shadow p-4">
            <h3 className="font-semibold text-blue-900 mb-1">Closing note</h3>
            <p className="text-sm text-blue-900 whitespace-pre-wrap">
              {s.closing_note || "Not available."}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const SummaryCard = ({ title, text }) => (
    <div className="bg-white rounded-xl shadow p-4">
      <h3 className="font-semibold text-gray-800 mb-1">{title}</h3>
      <p className="text-sm text-gray-700 whitespace-pre-wrap">
        {text || "Not available."}
      </p>
    </div>
  );

  // =======================================================================
  // MAIN RENDER (fixed-height card, only inner areas scroll)
  // =======================================================================

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      {/* FIXED HEIGHT CONTAINER → only inner sections will scroll */}
      <div className="w-full max-w-5xl h-[700px] bg-white rounded-2xl shadow-2xl flex overflow-hidden">
        {/* LEFT SIDEBAR */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          filterValue={filterValue}
          setFilterValue={setFilterValue}
          filteredReports={filteredReports}
          reportsLoading={reportsLoading}
          selectedReport={selectedReport}
          setSelectedReport={setSelectedReport}
          hasActiveSession={hasActiveSession}
        />

        {/* RIGHT MAIN AREA */}
        <div className="flex-1 flex flex-col">
          {activeTab === "chat" ? (
            <ChatPanel
              messages={messages}
              chatRef={chatRef}
              sendMsg={sendMsg}
              inputValue={inputValue}
              setInput={setInput}
              isLoading={isLoading}
              endSession={endSession}
              isEnding={isEnding}
              hasActiveSession={hasActiveSession}
              isGeneratingSummary={isGeneratingSummary}
            />
          ) : (
            renderSummaryDetail()
          )}
        </div>
      </div>
    </div>
  );
};

// ---------------- Sidebar Component ----------------

const Sidebar = ({
  activeTab,
  setActiveTab,
  filterValue,
  setFilterValue,
  filteredReports,
  reportsLoading,
  selectedReport,
  setSelectedReport,
  hasActiveSession,
}) => {
  return (
    <div className="w-1/3 border-r bg-gray-50 flex flex-col">
      <div className="p-4 border-b bg-white">
        <h1 className="text-lg font-bold text-gray-800">
          ArogyaMitra Assistant
        </h1>
        <p className="text-xs text-gray-500">Supportive wellness companion</p>
      </div>

      {/* Tabs */}
      <div className="flex">
        <TabButton
          title="Chat Assistant"
          active={activeTab === "chat"}
          onClick={() => setActiveTab("chat")}
        />
        <TabButton
          title="Session Summaries"
          active={activeTab === "summaries"}
          onClick={() => setActiveTab("summaries")}
        />
      </div>

      {/* Content inside sidebar - scroll only inside this box */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === "chat" ? (
          <div className="space-y-2 text-xs text-gray-600">
            <p className="font-semibold">Session status:</p>
            <p
              className={hasActiveSession ? "text-green-600" : "text-gray-500"}
            >
              {hasActiveSession
                ? "Active session in progress."
                : "No active session. Start chatting to begin."}
            </p>
            <p className="mt-2">
              When you click <span className="font-semibold">End Session</span>,
              the conversation will be summarized and cleared.
            </p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="mb-3">
              <input
                type="text"
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                placeholder="Filter by name, text, or date..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {reportsLoading ? (
              <div className="text-xs text-gray-500">Loading summaries...</div>
            ) : filteredReports.length === 0 ? (
              <div className="text-xs text-gray-500">
                No session summaries found.
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto">
                {filteredReports.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedReport(r)}
                    className={`w-full text-left p-3 rounded-lg border text-xs ${
                      selectedReport && selectedReport.id === r.id
                        ? "bg-blue-50 border-blue-400"
                        : "bg-white border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="font-semibold text-gray-800">
                      {r.session_name || `Session #${r.id}`}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {new Date(r.created_at).toLocaleString()}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const TabButton = ({ title, active, onClick }) => (
  <button
    className={`flex-1 py-2 text-sm font-medium border-b-2 ${
      active
        ? "border-blue-600 text-blue-600"
        : "border-transparent text-gray-500"
    }`}
    onClick={onClick}
  >
    {title}
  </button>
);

// ---------------- Chat Panel (inner scroll ONLY here) ----------------

const ChatPanel = ({
  messages,
  chatRef,
  sendMsg,
  inputValue,
  setInput,
  isLoading,
  endSession,
  isEnding,
  hasActiveSession,
  isGeneratingSummary,
}) => {
  return (
    <>
      {/* Header fixed */}
      <header className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div>
          <h2 className="text-lg font-bold">Wellness Chat</h2>
          <p className="text-xs text-blue-100">Your supportive AI assistant</p>
        </div>

        <button
          onClick={endSession}
          disabled={isEnding || !hasActiveSession}
          className={`px-3 py-1 rounded-full text-xs shadow ${
            isEnding || !hasActiveSession
              ? "bg-red-300 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {isEnding ? "Ending..." : "End Session"}
        </button>
      </header>

      {/* Chat log box - ONLY this scrolls inside fixed-height container */}
      <div
        ref={chatRef}
        className="flex-1 p-4 space-y-4 overflow-y-auto bg-white"
      >
        {messages.map((msg) => (
          <MessageBubble key={msg.id} text={msg.text} sender={msg.sender} />
        ))}

        {isLoading && <LoadingBubble />}

        {!messages.length && !isLoading && (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            Start typing a message to begin a new session.
          </div>
        )}

        {isGeneratingSummary && (
          <div className="text-center text-xs text-gray-500 mt-4">
            Generating summary… please wait.
          </div>
        )}
      </div>

      {/* Input bar fixed at bottom */}
      <form
        onSubmit={sendMsg}
        className="p-4 border-t bg-gray-50 flex items-center gap-2"
      >
        <input
          value={inputValue}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading || isEnding || isGeneratingSummary}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 text-sm"
        />
        <button
          type="submit"
          disabled={isLoading || isEnding || isGeneratingSummary}
          className="h-11 w-11 bg-blue-600 flex items-center justify-center rounded-full shadow-md hover:bg-blue-700 transition disabled:bg-blue-300"
        >
          <SendIcon />
        </button>
      </form>
    </>
  );
};

export default ArogyaMitraAIChat;
