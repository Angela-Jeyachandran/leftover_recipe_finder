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