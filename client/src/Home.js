import React from "react";
import { Link } from "react-router-dom";
import "./App.css";

function Home() {
    return (
    <div className="home-container">
        <h1 className="title">Leftover Recipe Generator</h1>

        <p className="subtitle">
            Turn the ingredients you already have into delicious meals.
        </p>

        <Link to="/recipes">
            <button className="enter-btn">Start Cooking</button>
        </Link>
    </div>
    );
}

export default Home;
