import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { 
  LogOut, LayoutDashboard, Receipt, User as UserIcon, 
  Wallet, MessageSquare, Globe, Moon, Sun 
} from "lucide-react";

export const CURRENCY_SYMBOLS: { [key: string]: string } = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  AUD: "A$",
  CAD: "C$",
};

export const Navbar = () => {
  const { user, logout, updateCurrency } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) return null;

  return (
    <nav className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-6 hidden md:block transition-colors duration-200">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center">
            <Wallet className="text-white dark:text-black w-6 h-6" />
          </div>
          <span className="font-bold text-xl tracking-tight dark:text-white">FinanceAI</span>
        </div>
        <button
          onClick={toggleTheme}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
        >
          {theme === "light" ? <Moon size={20} className="text-gray-600" /> : <Sun size={20} className="text-yellow-400" />}
        </button>
      </div>

      <div className="space-y-2 mb-10">
        <NavLink to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" />
        <NavLink to="/expenses" icon={<Receipt size={20} />} label="Expenses" />
        <NavLink to="/coach" icon={<MessageSquare size={20} />} label="AI Coach" />
      </div>

      <div className="space-y-4">
        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3">Preferences</p>
        <div className="px-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
            <Globe size={18} className="text-gray-400 dark:text-gray-500" />
            <select
              value={user.currency}
              onChange={(e) => updateCurrency(e.target.value)}
              className="bg-transparent text-sm font-medium outline-none w-full cursor-pointer dark:text-white"
            >
              {Object.keys(CURRENCY_SYMBOLS).map((curr) => (
                <option key={curr} value={curr} className="dark:bg-gray-800">
                  {curr} ({CURRENCY_SYMBOLS[curr]})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-6 right-6">
        <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <UserIcon size={20} className="text-gray-600 dark:text-gray-400" />
          </div>
          <div className="overflow-hidden">
            <p className="font-medium text-sm truncate dark:text-white">{user.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full p-3 text-gray-600 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </nav>
  );
};

const NavLink = ({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) => (
  <Link
    to={to}
    className="flex items-center gap-3 p-3 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all"
  >
    {icon}
    <span className="font-medium">{label}</span>
  </Link>
);
