import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// --- Placeholder Imports for structure (You will create these next) ---
// Public Pages
import PublicHome from "./pages/public/Home";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";

// Portfolio Pages
import PortfolioLayout from "./pages/portfolio/PortfolioLayout";
import UserHome from "./pages/portfolio/UserHome";
import UserProjects from "./pages/portfolio/UserProjects";
import UserSettings from "./pages/portfolio/UserSettings";

// Context Providers
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* ----------------------------- */}
          {/* PUBLIC ROUTES (PortfoliMe)    */}
          {/* ----------------------------- */}
          <Route path="/" element={<PublicHome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ----------------------------- */}
          {/* USER PORTFOLIO ROUTES         */}
          {/* URL: portfoli.me/username/... */}
          {/* ----------------------------- */}

          {/* The :username param captures "user1", "john_doe", etc. */}
          <Route path="/:username" element={<PortfolioLayout />}>
            <Route index element={<Navigate to="home" replace />} />
            <Route path="home" element={<UserHome />} />
            <Route path="projects" element={<UserProjects />} />
            <Route path="settings" element={<UserSettings />} />
          </Route>

          {/* 404 Fallback */}
          <Route
            path="*"
            element={
              <div className="text-white text-center mt-20">
                404 - Page Not Found
              </div>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
