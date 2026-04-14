import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Send, Bot, User as UserIcon, Loader2, Sparkles, Globe, Search, X } from "lucide-react";
import { toast } from "sonner";
import { CURRENCY_SYMBOLS } from "../components/Navbar";

interface Message {
  role: "user" | "model";
  text: string;
}

export const Coach = () => {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { role: "model", text: `Hello ${user?.name}! I'm your AI Financial Coach. How can I help you reach your financial goals today?` }
  ]);
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);
  const [rates, setRates] = useState<{ [key: string]: number }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchRates();
  }, [user?.currency]);

  const fetchRates = async () => {
    try {
      const res = await fetch("/api/currency/rates?base=INR", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setRates(await res.json());
    } catch (err) {
      console.error("Failed to fetch rates:", err);
    }
  };

  const scrollToBottom = () => {
    if (!searchQuery) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMessage }]);
    setLoading(true);

    try {
      // Fetch recent expenses for context
      const expRes = await fetch("/api/expenses", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const expenses = expRes.ok ? await expRes.json() : [];

      const res = await fetch("/api/ai/coach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          messages: messages.slice(-10),
          systemInstruction: `
            You are a professional and encouraging AI Financial Coach. 
            User's Name: ${user?.name}.
            User's Preferred Currency: ${user?.currency || "INR"}.
            Context: The user is using a finance tracker app. 
            Recent Expenses (in INR): ${JSON.stringify(expenses.slice(0, 20))}.
            Provide concise, helpful, and realistic financial advice. 
            If asked about their spending, refer to the provided context and mention amounts in their preferred currency (${user?.currency || "INR"}).
            Always encourage saving and smart budgeting.
          `
        })
      });

      if (!res.ok) throw new Error("Coach response failed");
      const data = await res.json();
      setMessages(prev => [...prev, { role: "model", text: data.text }]);
    } catch (err) {
      console.error(err);
      toast.error("Failed to get a response from the coach");
    } finally {
      setLoading(false);
    }
  };

  const filteredMessages = messages.filter(m => 
    m.text.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden transition-colors duration-200">
      <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center">
            <Bot className="text-white dark:text-black" size={20} />
          </div>
          {!showSearch && (
            <div>
              <h2 className="font-bold dark:text-white">AI Financial Coach</h2>
              <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Online & Ready to help
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 flex-1 justify-end max-w-md">
          {showSearch ? (
            <div className="relative w-full flex items-center animate-in fade-in slide-in-from-right-4 duration-200">
              <Search className="absolute left-3 text-gray-400" size={16} />
              <input
                type="text"
                autoFocus
                placeholder="Search messages..."
                className="w-full pl-10 pr-10 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-black dark:focus:border-white transition-all dark:text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button 
                onClick={() => { setShowSearch(false); setSearchQuery(""); }}
                className="absolute right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowSearch(true)}
              className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              <Search size={20} />
            </button>
          )}
          {!showSearch && <Sparkles className="text-yellow-500" size={20} />}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {debouncedSearchQuery && filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
            <Search size={48} className="mb-4 opacity-20" />
            <p className="text-lg font-medium">No messages found</p>
            <p className="text-sm">Try searching for a different keyword</p>
          </div>
        ) : (
          filteredMessages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`flex gap-3 max-w-[80%] ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === "user" ? "bg-gray-100 dark:bg-gray-800" : "bg-black dark:bg-white"}`}>
                  {m.role === "user" ? <UserIcon size={16} className="text-gray-600 dark:text-gray-400" /> : <Bot size={16} className="text-white dark:text-black" />}
                </div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed ${m.role === "user" ? "bg-blue-600 text-white rounded-tr-none" : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none"}`}>
                  {m.text}
                </div>
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="flex gap-3 items-center text-gray-400 dark:text-gray-500 text-sm">
              <div className="w-8 h-8 bg-black dark:bg-white rounded-full flex items-center justify-center">
                <Loader2 size={16} className="text-white dark:text-black animate-spin" />
              </div>
              Coach is thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
        <div className="relative">
          <input
            type="text"
            className="w-full pl-4 pr-12 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 outline-none focus:border-black dark:focus:border-white bg-white dark:bg-gray-800 dark:text-white transition-all"
            placeholder="Ask about your spending, saving tips, or budgeting..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2 top-2 bottom-2 w-10 bg-black dark:bg-white text-white dark:text-black rounded-xl flex items-center justify-center hover:bg-gray-800 dark:hover:bg-gray-200 transition-all disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};
