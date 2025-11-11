import React, { useState } from "react";
import axios from "axios";


function RecipeCard({ recipe }) {
    const { title, image, cuisines, readyInMinutes, usedIngredients, missedIngredients, sourceUrl } = recipe;

    const [subs, setSubs] = useState({});
    const [loadingSubs, setLoadingSubs] = useState({});

    // Fetch substitutions for a specific ingredient
    // ✅ Fetch substitutions for a specific ingredient
    const fetchSubstitutions = async (ingredient) => {
        setLoadingSubs((prev) => ({ ...prev, [ingredient]: true }));

        try {
            const res = await axios.get(
                `http://localhost:5001/api/substitutions?ingredient=${ingredient}`
            );

            if (res.status === 200 && res.data?.substitutes) {
                // 🧠 Clean and simplify substitutes (remove measurements & phrases)
                const cleanSubs =
                    res.data.substitutes
                        ?.map((s) =>
                            s
                                .replace(/.*=\s*/g, "") // remove "1 cup = " etc.
                                .replace(
                                    /\b\d+\s*(cup|tbsp|tsp|oz|grams?|ml|cups?|tablespoons?|teaspoons?)\b/gi,
                                    ""
                                ) // remove units
                                .trim()
                        )
                        .filter((s) => s.length > 0) || [];

                // ✅ Optional: remove duplicates and normalize case
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
                                    {ing.name}
                                    <button
                                        onClick={() => fetchSubstitutions(ing.name)}
                                        disabled={loadingSubs[ing.name]}
                                        className="sub-btn"
                                    >
                                        {loadingSubs[ing.name] ? "..." : "Find Substitute"}
                                    </button>

                                    {/* Substitutions List */}
                                    {subs[ing.name] && (
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
