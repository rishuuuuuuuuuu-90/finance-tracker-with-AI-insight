import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Plus, Trash2, Edit2, Search, Filter, Loader2, X, Camera, Scan } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { CURRENCY_SYMBOLS } from "../components/Navbar";

interface Expense {
  _id: string;
  amount: number;
  category: string;
  date: string;
  description: string;
}

export const Expenses = () => {
  const { token, user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [budgetLimit, setBudgetLimit] = useState<number>(0);
  const [scanning, setScanning] = useState(false);
  const [rates, setRates] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    fetchExpenses();
    fetchBudget();
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

  // Form State
  const [formData, setFormData] = useState({
    amount: "",
    category: "Food",
    date: format(new Date(), "yyyy-MM-dd"),
    description: "",
  });

  const categories = ["Food", "Transport", "Shopping", "Entertainment", "Bills", "Health", "Other"];

  useEffect(() => {
    fetchExpenses();
    fetchBudget();
    fetchRates();
  }, [user?.currency]);

  const fetchExpenses = async () => {
    try {
      const res = await fetch("/api/expenses", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setExpenses(await res.json());
    } catch (err) {
      toast.error("Failed to fetch expenses");
    } finally {
      setLoading(false);
    }
  };

  const fetchBudget = async () => {
    try {
      const res = await fetch("/api/budget", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBudgetLimit(data.monthlyLimit);
      }
    } catch (err) {}
  };

  const handleSaveBudget = async (limit: number) => {
    try {
      const res = await fetch("/api/budget", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ monthlyLimit: limit }),
      });
      if (res.ok) {
        setBudgetLimit(limit);
        toast.success("Budget updated");
      }
    } catch (err) {
      toast.error("Failed to update budget");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingExpense ? `/api/expenses/${editingExpense._id}` : "/api/expenses";
    const method = editingExpense ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount)
        }),
      });

      if (res.ok) {
        toast.success(editingExpense ? "Expense updated" : "Expense added");
        fetchExpenses();
        setShowModal(false);
        setEditingExpense(null);
        setFormData({
          amount: "",
          category: "Food",
          date: format(new Date(), "yyyy-MM-dd"),
          description: "",
        });
      }
    } catch (err) {
      toast.error("Failed to save expense");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("Expense deleted");
        setExpenses(expenses.filter(e => e._id !== id));
      }
    } catch (err) {
      toast.error("Failed to delete expense");
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      amount: expense.amount.toString(),
      category: expense.category,
      date: format(new Date(expense.date), "yyyy-MM-dd"),
      description: expense.description,
    });
    setShowModal(true);
  };

  const handleScanReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    toast.info("Scanning receipt with AI...");

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = (reader.result as string).split(",")[1];
        
        const res = await fetch("/api/ai/scan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ base64Image, mimeType: file.type })
        });

        if (!res.ok) throw new Error("Receipt scanning failed");
        const result = await res.json();

        setFormData({
          amount: result.amount.toString(),
          category: categories.includes(result.category) ? result.category : "Other",
          date: result.date || format(new Date(), "yyyy-MM-dd"),
          description: result.description || "",
        });
        setShowModal(true);
        toast.success("Receipt scanned successfully!");
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      toast.error("Failed to scan receipt");
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight dark:text-white">Expenses</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your daily transactions</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              const limit = prompt("Enter monthly budget limit:", budgetLimit.toString());
              if (limit) handleSaveBudget(parseFloat(limit));
            }}
            className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-6 py-3 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all dark:text-white"
          >
            Set Budget
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-xl font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-all"
          >
            <Plus size={18} />
            Add Expense
          </button>
          <label className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all cursor-pointer">
            {scanning ? <Loader2 className="animate-spin" size={18} /> : <Scan size={18} />}
            {scanning ? "Scanning..." : "Scan Receipt"}
            <input type="file" accept="image/*" className="hidden" onChange={handleScanReceipt} disabled={scanning} />
          </label>
        </div>
      </header>

      {/* Expense Table */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                <th className="px-8 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Amount</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-gray-400 dark:text-gray-600" size={32} />
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-gray-500 dark:text-gray-400">
                    No expenses found. Start by adding one!
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-8 py-4 text-sm text-gray-600 dark:text-gray-400">{format(new Date(expense.date), "MMM dd, yyyy")}</td>
                    <td className="px-8 py-4">
                      <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-sm text-gray-900 dark:text-gray-100 font-medium">{expense.description || "-"}</td>
                    <td className="px-8 py-4 text-sm font-bold text-right dark:text-white">{formatCurrency(expense.amount)}</td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(expense)} className="p-2 text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(expense._id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-3xl p-8 shadow-2xl border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold dark:text-white">{editingExpense ? "Edit Expense" : "Add Expense"}</h2>
              <button onClick={() => { setShowModal(false); setEditingExpense(null); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                <X size={20} className="dark:text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Amount (INR)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 outline-none focus:border-black dark:focus:border-white bg-white dark:bg-gray-800 dark:text-white"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Category</label>
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 outline-none focus:border-black dark:focus:border-white bg-white dark:bg-gray-800 dark:text-white"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {categories.map(c => <option key={c} value={c} className="dark:bg-gray-800">{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Date</label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 outline-none focus:border-black dark:focus:border-white bg-white dark:bg-gray-800 dark:text-white"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <textarea
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 outline-none focus:border-black dark:focus:border-white bg-white dark:bg-gray-800 dark:text-white"
                  rows={3}
                  placeholder="What was this for?"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-all"
              >
                {editingExpense ? "Update Expense" : "Save Expense"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
