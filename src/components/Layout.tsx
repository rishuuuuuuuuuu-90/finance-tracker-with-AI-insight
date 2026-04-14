import React from "react";
import { Navbar } from "./Navbar";
import { Toaster } from "sonner";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex transition-colors duration-200">
      <Navbar />
      <main className="flex-1 md:ml-64 p-4 md:p-10">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
      <Toaster position="top-right" richColors />
    </div>
  );
};
