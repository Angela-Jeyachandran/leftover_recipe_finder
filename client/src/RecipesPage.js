import React, { useEffect, useState } from 'react';
import axios from 'axios';
import RecipeCard from "./components/RecipeCard";
import "./App.css";




function RecipesPage() {
  const [ingredients, setIngredients] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [cuisine, setCuisine] = useState('');
  const [recipeCount, setRecipeCount] = useState(3);


  const cuisineOptions = [
    "African", "American", "British", "Cajun", "Caribbean", "Chinese",
    "Eastern European", "European", "French", "German", "Greek", "Indian",
    "Irish", "Italian", "Japanese", "Jewish", "Korean", "Latin American",
    "Mediterranean", "Mexican", "Middle Eastern", "Nordic", "Southern",
    "Spanish", "Thai", "Vietnamese"
  ]

  const handleSearch = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5001/api/recipes?ingredients=${ingredients}&cuisine=${cuisine}&number=${recipeCount}`
      );
      setRecipes(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  /* TEMPORARY HARD CODE TO TEST CSS */

  useEffect(() => {
    const defaultRecipes = [
      {
        id: 1,
        title: "Creamy Garlic Tomato Pasta",
        image: "img/pasta.jpg",
        cuisines: ["Italian"],
        readyInMinutes: 25,
        usedIngredients: [
          { id: 11, name: "tomato" },
          { id: 12, name: "garlic" },
          { id: 13, name: "pasta" },
        ],
        missedIngredients: [
          { id: 14, name: "basil" },
          { id: 15, name: "parmesan" },
        ],
        sourceUrl: "#",
      },
      {
        id: 2,
        title: "Garlic Chicken Stir-Fry with Veggies",
        image: "img/fry.jpg",
        cuisines: ["Asian"],
        readyInMinutes: 20,
        usedIngredients: [
          { id: 21, name: "chicken" },
          { id: 22, name: "garlic" },
          { id: 23, name: "soy sauce" },
        ],
        missedIngredients: [
          { id: 24, name: "broccoli" },
          { id: 25, name: "green onions" },
        ],
        sourceUrl: "#",
      },
      {
        id: 3,
        title: "Cheesy Veggie Tacos with Avocado",
        image: "img/tacos.jpg",
        cuisines: ["Mexican"],
        readyInMinutes: 15,
        usedIngredients: [
          { id: 31, name: "beans" },
          { id: 32, name: "cheese" },
          { id: 33, name: "tortillas" },
        ],
        missedIngredients: [
          { id: 34, name: "avocado" },
          { id: 35, name: "lettuce" },
        ],
        sourceUrl: "#",
      },
    ];




    setRecipes(defaultRecipes);
  }, []);

  /* TEMPORARY HARD CODE TO TEST CSS */

  return (
    <div>
      <h1>Leftover Recipe Finder</h1>
      <div className="search-bar">
        <input
          type="text"
          value={ingredients}
          onChange={e => setIngredients(e.target.value)}
          placeholder="Enter ingredients, comma-separated"
        />

        <select value={cuisine} onChange={e => setCuisine(e.target.value)}>
          <option value="">Any cuisine</option>
          {cuisineOptions.map((c, index) => (
            <option key={index} value={c}>{c}</option>
          ))}
        </select>

        <input
          type="number"
          min="3"
          max="12"
          step="1"
          value={recipeCount}
          onChange={(e) => setRecipeCount(e.target.value)}
          className="count-input"
        />
        
        <button onClick={handleSearch}>Search</button>
      </div>


      <div className="recipe-container">
        {recipes.length > 0 ? (
          recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))
        ) : (
          <p>No recipes yet. Try searching above!</p>
        )}
      </div>
    </div>
  );
}

export default RecipesPage;
