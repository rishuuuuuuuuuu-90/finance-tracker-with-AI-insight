import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from "recharts";
import { 
  TrendingUp, TrendingDown, DollarSign, Sparkles, 
  AlertCircle, ArrowUpRight, ArrowDownRight, Globe,
  Wallet, Target, Tag
} from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { toast } from "sonner";
import { CURRENCY_SYMBOLS } from "../components/Navbar";

interface Expense {
  _id: string;
  amount: number;
  category: string;
  date: string;
  description: string;
}

interface Budget {
  monthlyLimit: number;
}

export const Dashboard = () => {
  const { token, user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budget, setBudget] = useState<Budget>({ monthlyLimit: 0 });
  const [insights, setInsights] = useState<string>("");
  const [prediction, setPrediction] = useState<string>("");
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [rates, setRates] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    fetchData();
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

  const convert = (amount: number) => {
    if (!user?.currency || user.currency === "INR") return amount;
    const rate = rates[user.currency];
    return rate ? amount * rate : amount;
  };

  const formatCurrency = (amount: number) => {
    const converted = convert(amount);
    const symbol = CURRENCY_SYMBOLS[user?.currency || "INR"];
    return `${symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const fetchData = async () => {
    try {
      const [expRes, budRes] = await Promise.all([
        fetch("/api/expenses", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/budget", { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      if (expRes.ok) setExpenses(await expRes.json());
      if (budRes.ok) setBudget(await budRes.json());
    } catch (err) {
      toast.error("Failed to fetch data");
    }
  };

  const generateInsights = async () => {
    if (expenses.length === 0) {
      setInsights("Add some expenses to get AI-powered financial insights!");
      return;
    }

    setLoadingInsights(true);
    try {
      const expenseData = expenses.map(e => ({
        amount: e.amount,
        category: e.category,
        date: e.date,
        description: e.description
      }));

      const prompt = `
        Analyze the following expense data for a personal finance tracker and provide 3-4 concise, actionable financial insights or tips.
        Focus on spending habits, category distribution, and potential saving opportunities.
        The user's preferred currency is ${user?.currency || "INR"}. 
        Please mention amounts in this currency.
        Format the response as a bulleted list of short sentences.
        
        Data (in INR): ${JSON.stringify(expenseData)}
      `;

      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ prompt })
      });

      if (!res.ok) throw new Error("AI Analysis failed");
      const data = await res.json();
      setInsights(data.text || "No insights available at the moment.");
    } catch (err) {
      console.error("AI Insights error:", err);
      toast.error("Failed to generate AI insights");
    } finally {
      setLoadingInsights(false);
    }
  };

  const generatePrediction = async () => {
    if (expenses.length < 3) {
      setPrediction("Add at least 3 expenses to enable smart spending predictions!");
      return;
    }

    setLoadingPrediction(true);
    try {
      const expenseData = expenses.map(e => ({
        amount: e.amount,
        category: e.category,
        date: e.date
      }));

      const prompt = `
        Based on the following historical expense data, predict the user's spending for the NEXT month.
        Provide a total estimated amount and a breakdown of which categories might see an increase or decrease.
        The user's preferred currency is ${user?.currency || "INR"}.
        Please mention amounts in this currency.
        Be concise and professional.
        
        Data (in INR): ${JSON.stringify(expenseData)}
      `;

      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ prompt })
      });

      if (!res.ok) throw new Error("AI Prediction failed");
      const data = await res.json();
      setPrediction(data.text || "Prediction unavailable.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate prediction");
    } finally {
      setLoadingPrediction(false);
    }
  };

  const currentMonthExpenses = expenses.filter(e => {
    const date = new Date(e.date);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });

  const totalSpent = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const budgetStatus = budget.monthlyLimit > 0 ? (totalSpent / budget.monthlyLimit) * 100 : 0;

  // Chart Data: Category Distribution
  const categoryData = Object.entries(
    expenses.reduce((acc: any, e) => {
      acc[e.category] = (acc[e.category] || 0) + convert(e.amount);
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  // Chart Data: Monthly Spending
  const monthlyData = Object.entries(
    expenses.reduce((acc: any, e) => {
      const month = format(new Date(e.date), "MMM");
      acc[month] = (acc[month] || 0) + convert(e.amount);
      return acc;
    }, {})
  ).map(([name, amount]) => ({ name, amount })).reverse().slice(-6);

  const COLORS = ["#000000", "#4B5563", "#9CA3AF", "#D1D5DB", "#E5E7EB"];

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight dark:text-white">Financial Overview</h1>
          <p className="text-gray-500 dark:text-gray-400">Track your spending and get AI insights</p>
        </div>
        <button
          onClick={generateInsights}
          disabled={loadingInsights}
          className="flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-xl font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-all disabled:opacity-50"
        >
          {loadingInsights ? (
            <span className="animate-pulse">Analyzing...</span>
          ) : (
            <>
              <Sparkles size={18} />
              Get AI Insights
            </>
          )}
        </button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Spent (Month)" 
          value={formatCurrency(totalSpent)} 
          icon={<span className="text-blue-600 dark:text-blue-400 font-bold text-xl">{CURRENCY_SYMBOLS[user?.currency || "INR"]}</span>}
          trend={budget.monthlyLimit > 0 && totalSpent > budget.monthlyLimit ? "Over Budget" : "On Track"}
          isNegative={budget.monthlyLimit > 0 && totalSpent > budget.monthlyLimit}
        />
        <StatCard 
          title="Monthly Budget" 
          value={formatCurrency(budget.monthlyLimit)} 
          icon={<Target className="text-green-600 dark:text-green-400" />}
          trend={`${budgetStatus.toFixed(1)}% used`}
        />
        <StatCard 
          title="Top Category" 
          value={categoryData[0]?.name || "N/A"} 
          icon={<Tag className="text-purple-600 dark:text-purple-400" />}
          trend={formatCurrency(categoryData[0]?.value as number || 0)}
        />
      </div>

      {/* AI Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {insights && (
          <div className="bg-gradient-to-br from-gray-900 to-black dark:from-gray-800 dark:to-gray-950 text-white p-8 rounded-3xl shadow-xl border border-white/5">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="text-yellow-400" />
              <h2 className="text-xl font-bold">AI Financial Insights</h2>
            </div>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 dark:text-gray-400 text-sm leading-relaxed whitespace-pre-line">{insights}</p>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl font-bold dark:text-white">Smart Prediction</h2>
            </div>
            <button 
              onClick={generatePrediction}
              disabled={loadingPrediction}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
            >
              {loadingPrediction ? "Predicting..." : "Refresh Prediction"}
            </button>
          </div>
          {prediction ? (
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed whitespace-pre-line">{prediction}</p>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <AlertCircle className="text-gray-300 dark:text-gray-700 mb-2" size={32} />
              <p className="text-gray-400 dark:text-gray-500 text-sm">Click refresh to see next month's spending forecast</p>
            </div>
          )}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <h3 className="text-lg font-bold mb-6 dark:text-white">Monthly Spending</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: "rgba(156, 163, 175, 0.1)" }}
                  contentStyle={{ 
                    borderRadius: "12px", 
                    border: "none", 
                    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                    backgroundColor: "var(--color-bg-card, #fff)",
                    color: "var(--color-text-main, #000)"
                  }}
                />
                <Bar dataKey="amount" fill="currentColor" className="text-black dark:text-white" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <h3 className="text-lg font-bold mb-6 dark:text-white">Category Distribution</h3>
          <div className="h-80 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: "12px", 
                    border: "none", 
                    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                    backgroundColor: "var(--color-bg-card, #fff)",
                    color: "var(--color-text-main, #000)"
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            {categoryData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-xs text-gray-600 dark:text-gray-400">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, trend, isNegative }: any) => (
  <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm transition-colors duration-200">
    <div className="flex items-center justify-between mb-4">
      <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center transition-colors duration-200">
        {icon}
      </div>
      {trend && (
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${isNegative ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" : "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"}`}>
          {trend}
        </span>
      )}
    </div>
    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</p>
    <h4 className="text-2xl font-bold mt-1 tracking-tight dark:text-white">{value}</h4>
  </div>
);
