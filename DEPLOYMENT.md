# Deployment Guide: Personal Finance Tracker

This guide explains how to deploy your application to production using Render (Backend) and Vercel (Frontend).

## Prerequisites
- A GitHub account
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account
- A [Render](https://render.com/) account
- A [Vercel](https://vercel.com/) account
- Google Gemini API Key (from [Google AI Studio](https://aistudio.google.com/))

---

## 1. Database Setup (MongoDB Atlas)
1. Log in to MongoDB Atlas.
2. Create a new Project and a free Cluster (Shared).
3. Under **Network Access**, add `0.0.0.0/0` (allow access from anywhere).
4. Under **Database Access**, create a user with a password.
5. Click **Connect** -> **Drivers** -> **Node.js**.
6. Copy the connection string (it looks like `mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority`).
7. Replace `<password>` with your actual database user password.

---

## 2. Backend Deployment (Render)
1. Push your code to a GitHub repository.
2. Log in to Render and click **New** -> **Web Service**.
3. Connect your GitHub repository.
4. Configure the service:
   - **Name**: `finance-tracker-api`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node dist/server.cjs` (Note: You may need to adjust this based on your build setup. For this project, use `tsx server.ts` if Render supports it, or compile to JS).
5. Add **Environment Variables**:
   - `MONGODB_URI`: Your MongoDB Atlas connection string.
   - `JWT_SECRET`: A long random string.
   - `GEMINI_API_KEY`: Your Google Gemini API key.
   - `NODE_ENV`: `production`
6. Click **Create Web Service**. Copy the generated URL (e.g., `https://finance-tracker-api.onrender.com`).

---

## 3. Frontend Deployment (Vercel)
1. Log in to Vercel and click **Add New** -> **Project**.
2. Import your GitHub repository.
3. In **Build & Development Settings**:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add **Environment Variables**:
   - `VITE_API_URL`: The URL of your Render backend (e.g., `https://finance-tracker-api.onrender.com`).
5. Click **Deploy**.

---

## 4. Connecting Everything
In your frontend code, ensure you are using the `VITE_API_URL` environment variable for API calls.
Example:
```javascript
const API_URL = import.meta.env.VITE_API_URL || "";
fetch(`${API_URL}/api/expenses`, ...);
```

*Note: In the current AI Studio preview, the app is configured as a single full-stack service. For separate deployment, you would split the `server.ts` and `src/` folders into two repositories.*
