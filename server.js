/**
 * server.js
 *
 * Backend API server for the Leftover Recipe Application.
 *
 * This Express server acts as the middle layer between the React frontend
 * and the Spoonacular API. It is responsible for:
 *  - Fetching recipes based on user-provided ingredients
 *  - Ranking recipes by ingredient overlap and cuisine preference
 *  - Providing ingredient substitution suggestions
 *  - Caching responses to reduce external API calls
 *
 * Entry point:
 *   node server.js
 *
 * Environment requirements:
 *  - API_KEY must be defined in a .env file
 */

require('dotenv').config();

const express = require('express');
const app = express();
const axios = require('axios');
const cors = require('cors');


// -----------------------------
// In-memory caches
// -----------------------------
// NOTE: These reset when the server restarts.
const subsCache = {};
const recipeCache = {};

app.use(cors());

// -----------------------------
// Server configuration
// -----------------------------
const PORT = process.env.PORT || 5001;

// Removes long descriptions from ingredient list 
/*
function cleanIngredients(list) {
    return list
        .map(i => i.name.toLowerCase().trim())
        .filter(name =>
            name.length < 30 &&
            !name.includes("decorate") &&
            !name.includes("extra") &&
            !name.includes("punnet") &&
            !name.includes("worth") &&
            !name.includes("package") &&
            /^[a-z\s]+$/.test(name)
        );
}
*/

// -----------------------------
// Health check route
// -----------------------------
app.get('/', (req, res) => {
    res.send('Leftover Recipe API is running');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// -----------------------------
// Recipe search endpoint
// -----------------------------
/**
 * GET /api/recipes
 *
 * Query Parameters:
 *  - ingredients (string, required): Comma-separated ingredient list
 *  - number (int, optional): Number of recipes to return (default: 3)
 *  - cuisine (string, optional): Comma-separated cuisine preferences
 *
 * Returns:
 *  - Ranked list of recipe objects
 */
app.get('/api/recipes', async (req, res) => {
    const ingredients = req.query.ingredients;
    const number = parseInt(req.query.number) || 3;
    const cuisine = req.query.cuisine ? req.query.cuisine.split(',').map(c => c.toLowerCase()) : [];
    const apiKey = process.env.API_KEY;

    // -----------------------------
    // Normalize ingredient names
    // -----------------------------
    /**
    * Normalizes ingredient strings by:
    *  - converting to lowercase
    *  - removing symbols and punctuation
    *  - collapsing multiple spaces
    *
    * @param {string} name - Raw ingredient name
    * @returns {string} Normalized ingredient
    */
    function normalizeIngredient(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z\s]/g, "")
            .replace(/\s+/g, " ")
            .trim();
    }

    // -----------------------------
    // Pantry staples (always included)
    // -----------------------------
    // GOTCHA: Including pantry helps matching but can slightly skew scoring
    const pantry = ["salt", "oil"];

    // -----------------------------
    // Clean and deduplicate ingredients
    // -----------------------------
    const cleanIngredients = ingredients
        .split(",")
        .map(normalizeIngredient)
        .filter(Boolean);

    const ingSet = [...new Set(cleanIngredients)];

    // Add pantry staples + dedupe again
    const finalIngredients = [...new Set([...ingSet, ...pantry])].join(",");

    // -----------------------------
    // Cache lookup
    // -----------------------------
    const cacheKey = `${finalIngredients}|${number}|${cuisine.join(",")}`;

    if (recipeCache[cacheKey]) {
        console.log("Using cached recipes:", cacheKey);
        return res.json(recipeCache[cacheKey]);
    }

    if (!finalIngredients) return res.status(400).json({ error: 'Please provide ingredients' });

    try {
        // -----------------------------
        // Spoonacular API request
        // -----------------------------
        const response = await axios.get(
            'https://api.spoonacular.com/recipes/findByIngredients',
            {
                params: {
                    ingredients: finalIngredients,
                    number,
                    ranking: 1,
                    ignorePantry: true,
                    metaInformation: true,  
                    apiKey
                }
            }
        );
        // -----------------------------
        // Shape recipe response
        // -----------------------------
        let recipes = response.data.map(r => ({
            id: r.id,
            title: r.title,
            image: r.image,
            cuisines: r.cuisines || [],
            dishTypes: r.dishTypes || [],
            readyInMinutes: r.readyInMinutes || 0,
            usedIngredients: r.usedIngredients || [],
            missedIngredients: r.missedIngredients || [],

            matchesCuisine:
                cuisine.length === 0 ||
                (r.cuisines || []).some(c =>
                    cuisine.includes(c.toLowerCase())
                ),
            sourceUrl: null
        }));

        // Fetch full details to get sourceUrl
        for (let recipe of recipes) {
            try {
                const detail = await axios.get(
                    `https://api.spoonacular.com/recipes/${recipe.id}/information`,
                    { params: { apiKey } }
                );
                recipe.sourceUrl = detail.data.sourceUrl || "#";
            } catch {
                recipe.sourceUrl = "#";
            }
        }

        // -----------------------------
        // Rank recipes
        // -----------------------------
        // Primary score: ingredient overlap
        // Secondary score: cuisine preference
        recipes.sort((a, b) => {
            const scoreA = a.usedIngredients.length - a.missedIngredients.length;
            const scoreB = b.usedIngredients.length - b.missedIngredients.length;
            
            // If score is tied, fallback to cuisine preference
            if (scoreB === scoreA) {
                return (b.matchesCuisine === true) - (a.matchesCuisine === true);
            }
            
            return scoreB - scoreA;
        });


        /* Remove duplicates by recipe title
        const seen = new Set();
        recipes = recipes.filter(recipe => {
            const title = recipe.title.toLowerCase().trim();
            if (seen.has(title)) return false;
            seen.add(title);
            return true;
        });
        */

        // Return only the top N requested
        recipes = recipes.slice(0, number);

        // Cache result
        recipeCache[cacheKey] = recipes;

        res.json(recipes);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Failed to fetch recipes' });
    }
});


// -----------------------------
// Ingredient substitution endpoint
// -----------------------------
/**
 * GET /api/substitutions
 *
 * Query Parameters:
 *  - ingredient (string, required)
 *
 * Returns:
 *  - List of possible substitutes
 */
app.get('/api/substitutions', async (req, res) => {
    const ingredient = req.query.ingredient;
    const apiKey = process.env.API_KEY;

    if (!ingredient) {
        return res.status(400).json({ substitutes: ["Please provide an ingredient name"] });
    }

    // -----------------------------
    // Default substitutions
    // -----------------------------
    // NOTE: These override the API for common ingredients
    const defaultSubs = {
        milk: ["oat milk", "almond milk", "soy milk"],
        butter: ["margarine", "coconut oil", "olive oil"],
        egg: ["flax egg", "chia egg", "applesauce"],
        sugar: ["honey", "maple syrup", "coconut sugar"],
        cheese: ["nutritional yeast", "vegan cheese"],
        cream: ["coconut cream", "cashew cream"],
        flour: ["almond flour", "oat flour"],
        basil: ["oregano", "thyme", "spinach"],
        broccoli: ["cauliflower", "brussels sprouts", "asparagus"],
        garlic: ["shallots", "garlic powder", "chives"],
        chicken: ["tofu", "jackfruit"],
        tomato: ["canned tomatoes", "tomato sauce", "tomato paste + water"],
        onion: ["shallots", "leeks", "onion powder"],
        potato: ["sweet potato", "cauliflower", "turnips"],
        carrot: ["sweet potato", "butternut squash", "parsnips"],
        bell_pepper: ["poblano", "zucchini", "carrot"],
        spinach: ["kale", "arugula", "chard"],
        lemon: ["lime", "vinegar + a pinch of sugar"],
        lime: ["lemon", "white vinegar"],
        rice: ["quinoa", "cauliflower rice"],
        pasta: ["zoodles", "rice noodles", "quinoa"],
        ground_beef: ["turkey", "chicken", "lentils"],
        beef: ["mushrooms", "jackfruit", "seitan"],
        fish: ["tofu", "tempeh", "chickpeas"],
        soy_sauce: ["tamari", "coconut aminos", "Worcestershire"],
        vinegar: ["lemon juice", "lime juice"],
        oil: ["butter", "ghee", "coconut oil"],
        honey: ["maple syrup", "agave"],
        vanilla: ["almond extract", "maple syrup"],
        breadcrumbs: ["crushed crackers", "rolled oats", "panko"],
        cornstarch: ["flour", "arrowroot powder", "potato starch"],
        baking_powder: ["baking soda + cream of tartar"],
        baking_soda: ["baking powder (use 3x amount)"]
    };

    try {
        // Return fallback immediately if found
        const lower = ingredient.toLowerCase();

        // -----------------------------
        // Cache / fallback logic
        // -----------------------------
        if (subsCache[lower]) {
            console.log("Using cached substitute:", lower);
            return res.json({ ingredient, substitutes: subsCache[lower] });
        }

        if (defaultSubs[lower]) {
            return res.json({ ingredient, substitutes: defaultSubs[lower] });
        }

        // -----------------------------
        // Spoonacular substitution API
        // -----------------------------
        const response = await axios.get(
            'https://api.spoonacular.com/food/ingredients/substitutes',
            { params: { ingredientName: ingredient, apiKey } }
        );

        if (response.data.status === "failure" || !response.data.substitutes) {
            return res.json({
                ingredient,
                substitutes: [`No known substitutes for ${ingredient}`],
            });
        }

        subsCache[lower] = response.data.substitutes;

        res.json(response.data);

    } catch (err) {
        console.error("Substitution fetch error:", err.response?.data || err.message);
        res.json({
            ingredient,
            substitutes: [`No known substitutes for ${ingredient}`],
        });
    }
});
