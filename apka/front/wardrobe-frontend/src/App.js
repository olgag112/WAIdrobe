import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Wardrobe from "./pages/Wardrobe";
import Recommendation from "./pages/Recommendation"
import LoginPage from "./pages/LoginPage"
import './App.css'
import logo from "./images/logo.png";
import name from "./images/name.png";

function App() {
  return (
    <Router>
      <nav>
        <div className="nav-left">
          <img src={logo} alt="wAIdrobe logo" style={{ width: "5%", height: "auto" }} />
          <img src={name} alt="wAIdrobe name" style={{ width: "15%", height: "auto" }} />
        </div>

        <div className="nav-right">
          <Link to="/user">About me</Link>
          <Link to="/wardrobe">Wardrobe</Link>
          <Link to="/recommendations">See your recommendations!</Link>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/user" element={<Home />} />
        <Route path="/wardrobe" element={<Wardrobe />} />
        <Route path="/recommendations" element={<Recommendation />}/>
      </Routes>
    </Router>
  );
}

export default App;
