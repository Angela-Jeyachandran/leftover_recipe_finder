import React from "react";
import { Routes, Route } from "react-router-dom";

import Home from "./Home";
import RecipesPage from "./RecipesPage";

function App() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/recipes" element={<RecipesPage />} />
        </Routes>
    );
}

export default App;
