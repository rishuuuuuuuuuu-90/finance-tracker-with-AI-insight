# FinanceAI - Personal Finance Tracker with AI Insights

FinanceAI is a comprehensive full-stack application designed to help users track expenses, manage budgets, and receive AI-powered financial coaching. It leverages the power of Google Gemini and Groq to provide deep insights into spending habits and offer personalized financial advice.



## 🚀 Features

- **AI Financial Coach**: A real-time chat interface with message search and debounce optimization.
- **Smart Predictions**: AI-powered spending analysis using Groq and Google Gemini.
- **Receipt Scanning**: OCR-based receipt scanning to automatically add expenses.
- **Multi-Currency Support**: Real-time currency conversion with support for major global currencies.
- **Dashboard Analytics**: Visual representation of spending patterns and budget tracking.
- **Dark & Light Mode**: A polished, persistent theme system for a comfortable user experience.
- **Secure Authentication**: JWT-based user authentication with protected routes.

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS 4, Lucide Icons, Motion (Framer Motion).
- **Backend**: Node.js, Express.
- **Database**: MongoDB (Mongoose).
- **AI Integration**: Google Gemini API, Groq SDK.
- **State Management**: React Context API.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) (Local or Atlas)

## ⚙️ Environment Variables

Create a `.env` file in the root directory and add the following variables:

```env
# AI API Keys
GEMINI_API_KEY="your_gemini_api_key"
GROQ_API_KEY="your_groq_api_key"

# Database
MONGODB_URI="your_mongodb_connection_string"

# Security
JWT_SECRET="your_jwt_secret_key"

# External APIs
EXCHANGERATE_API_KEY="your_exchangerate_api_key"

# App Config
APP_URL="http://localhost:3000"
```

## 🏃 Getting Started

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/finance-ai.git
   cd finance-ai
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

## 📄 License

This project is licensed under the Apache-2.0 License.

---

Built with ❤️ using Google AI Studio Build.
