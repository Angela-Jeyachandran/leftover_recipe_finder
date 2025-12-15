/**
 * Home.js
 *
 * Landing page for the Leftover Recipe Application.
 *
 * This component serves as the initial user entry point.
 * It introduces the application and directs the user to
 * the recipe generation flow.
 *
 * User Interaction:
 *  - Clicking the "Start Cooking" button navigates the user
 *    to the RecipesPage via React Router.
 *
 * NOTE:
 * This component is intentionally stateless and contains
 * no data-fetching or business logic.
 */

import React from "react";
import { Link } from "react-router-dom";
import "./App.css";

function Home() {
    return (
    <div className="home-container">
        <h1 className="title">Leftover Recipe Finder</h1>

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
