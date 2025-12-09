/**
 * RecipeCard.js
 *
 * Presentation component responsible for displaying a single recipe.
 * Renders recipe metadata, ingredient lists, and provides optional
 * ingredient substitution suggestions via the backend API.
 *
 * This component is UI-focused and does not manage global application state.
 */

import React, { useState } from "react";
import axios from "axios";

/**
 * RecipeCard
 *
 * Displays a recipe card including title, image, cuisine, cook time,
 * used ingredients, missing ingredients, and a button to fetch
 * substitution suggestions for missing items.
 *
 * @param {Object} props
 * @param {Object} props.recipe - Recipe object returned from backend API
 */
function RecipeCard({ recipe }) {
    const { title, image, cuisines, readyInMinutes, usedIngredients, missedIngredients, sourceUrl } = recipe;

    // Stores fetched substitution lists per ingredient
    const [subs, setSubs] = useState({});
    // Tracks loading state for each ingredient's substitution request
    const [loadingSubs, setLoadingSubs] = useState({});
    // Tracks whether substitution list is expanded per ingredient
    const [openSubs, setOpenSubs] = useState({});


    /**
     * Fetch substitutions for a specific ingredient from the backend API.
     * Cleans and de-duplicates results before storing them in local state.
     */
    const fetchSubstitutions = async (ingredient) => {
        setLoadingSubs((prev) => ({ ...prev, [ingredient]: true }));

        try {
            const res = await axios.get(
                `http://localhost:5001/api/substitutions?ingredient=${ingredient}`
            );
            // Clean substitution strings by removing quantities and metadata
            if (res.status === 200 && res.data?.substitutes) {
                const cleanSubs =
                    res.data.substitutes
                        ?.map((s) =>
                            s
                                .replace(/.*=\s*/g, "")
                                .replace(
                                    /\b\d+\s*(cup|tbsp|tsp|oz|grams?|ml|cups?|tablespoons?|teaspoons?)\b/gi,
                                    ""
                                )
                                .trim()
                        )
                        .filter((s) => s.length > 0) || [];

                const uniqueSubs = [...new Set(cleanSubs.map((s) => s.trim()))];

                setSubs((prev) => ({
                    ...prev,
                    [ingredient]:
                        uniqueSubs.length > 0
                            ? uniqueSubs
                            : [`No known substitutes for ${ingredient}`],
                }));
            } else {
                console.warn("Unexpected API response:", res.data);
                setSubs((prev) => ({
                    ...prev,
                    [ingredient]: [`No known substitutes for ${ingredient}`],
                }));
            }
        } catch (error) {
            console.error(
                "Error fetching substitutions:",
                error.response?.data || error.message
            );
            setSubs((prev) => ({
                ...prev,
                [ingredient]: ["Could not fetch substitutes."],
            }));
        } finally {
            setLoadingSubs((prev) => ({ ...prev, [ingredient]: false }));
        }
    };


    return (
        <div className="recipe-card">
            <img src={image} alt={title} className="recipe-img" />

            <div className="recipe-info">
                <h2>{title}</h2>

                {cuisines && cuisines.length > 0 && (
                    <p className="cuisine">{cuisines.join(", ")}</p>
                )}

                <p>Ready in {readyInMinutes} minutes</p>

                {/* Used ingredients */}
                {usedIngredients && usedIngredients.length > 0 && (
                    <div className="ingredient-section">
                        <h4>Used Ingredients</h4>
                        <ul>
                            {usedIngredients.map((ing) => (
                                <li key={ing.id}>{ing.name}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Missing ingredients */}
                {missedIngredients && missedIngredients.length > 0 && (
                    <div className="ingredient-section missed">
                        <h4>Missing Ingredients</h4>
                        <ul>
                            {missedIngredients.map((ing) => (
                                <li key={ing.id}>
                                <div className="ingredient-row">
                                    {ing.name}
                        
                                    {/*Toggle functionality for Find substitute button*/}
                                    <button
                                        onClick={() => {
                                        // If already open, close it
                                        if (openSubs[ing.name]) {
                                        setOpenSubs(prev => ({ ...prev, [ing.name]: false }));
                                        return;
                                        }

                                        // If closed, fetch and open
                                        fetchSubstitutions(ing.name);
                                        setOpenSubs(prev => ({ ...prev, [ing.name]: true }));
                                        }}
                                    disabled={loadingSubs[ing.name]}
                                    className="sub-btn"
                                    >
                                        {openSubs[ing.name] ? "Hide Substitute" : "Find Substitute"}
                                    </button>
                                    </div>


                                    {/* Substitutions List */}
                                    {openSubs[ing.name] && subs[ing.name] && (
                                        <ul className="subs-list">
                                            {subs[ing.name].map((s, i) => (
                                                <li key={i}>{s}</li>
                                            ))}
                                        </ul>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
                    View Recipe
                </a>
            </div>
        </div>
    );
}

export default RecipeCard;
