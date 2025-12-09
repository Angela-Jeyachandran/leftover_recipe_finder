/**
 * App.js
 *
 * Root routing component for the Leftover Recipe Application frontend.
 *
 * This file defines the high-level navigation structure using React Router.
 * Each route maps a URL path to a top-level page component.
 *
 * Routes:
 *  - "/"          Home page where the user enters ingredients
 *  - "/recipes"   RecipesPage where results are displayed
 *
 * NOTE:
 * This component intentionally contains no UI logic or state.
 * It delegates all behavior to the routed components.
 */


import React from "react";
import { Routes, Route } from "react-router-dom";

// Top-level page components
import Home from "./Home";
import RecipesPage from "./RecipesPage";

function App() {
    return (
        // React Router v6 route configuration
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/recipes" element={<RecipesPage />} />
        </Routes>
    );
}

export default App;



