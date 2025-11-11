require('dotenv').config();
const express = require('express');
const app = express();
const axios = require('axios');
const cors = require('cors');
app.use(cors());


const PORT = process.env.PORT || 5001;

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

app.get('/api/recipes', async (req, res) => {
    const ingredients = req.query.ingredients; // comma-separated
    const number = parseInt(req.query.number) || 3;
    const cuisine = req.query.cuisine ? req.query.cuisine.split(',').map(c => c.toLowerCase()) : [];
    const apiKey = process.env.API_KEY;

    if (!ingredients) return res.status(400).json({ error: 'Please provide ingredients' });

    try {
        // Fetch recipes by ingredients
        const response = await axios.get(
            'https://api.spoonacular.com/recipes/findByIngredients',
            {
                params: {
                    ingredients: ingredients,
                    number,
                    ranking: 1,
                    ignorePantry: true,
                    apiKey
                }
            }
        );

        const originalMap = {};
        response.data.forEach(r => { originalMap[r.id] = r; });

        // Fetch recipe details in parallel
        const detailPromises = response.data.map(recipe =>
            axios.get(`https://api.spoonacular.com/recipes/${recipe.id}/information`, { params: { apiKey } })
        );
        const details = await Promise.all(detailPromises);

        // Combine used/missed ingredients and mark cuisine matches
        let recipes = details.map(detail => {
            const info = detail.data;
            const original = originalMap[info.id];
            const matchesCuisine = cuisine.length
                ? info.cuisines.some(c => cuisine.includes(c.toLowerCase()))
                : true;

            return {
                ...info,
                usedIngredients: original?.usedIngredients || [],
                missedIngredients: original?.missedIngredients || [],
                matchesCuisine
            };
        });

        // Sort recipes so matching cuisine are listed first
        recipes.sort((a, b) => (b.matchesCuisine === true) - (a.matchesCuisine === true));

        // Return only the top N requested
        recipes = recipes.slice(0, number);

        res.json(recipes);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Failed to fetch recipes' });
    }
});

// Substitutions endpoint
app.get('/api/substitutions', async (req, res) => {
    const ingredient = req.query.ingredient;
    const apiKey = process.env.API_KEY;

    if (!ingredient) {
        return res.status(400).json({ substitutes: ["Please provide an ingredient name"] });
    }

    // Default fallback list for common ingredients
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
        chicken: ["tofu", "jackfruit"]
    };

    try {
        // Return fallback immediately if found
        const lower = ingredient.toLowerCase();
        if (defaultSubs[lower]) {
            return res.json({ ingredient, substitutes: defaultSubs[lower] });
        }

        // Try Spoonacular
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

        res.json(response.data);

    } catch (err) {
        console.error("Substitution fetch error:", err.response?.data || err.message);
        res.json({
            ingredient,
            substitutes: [`No known substitutes for ${ingredient}`],
        });
    }
});
