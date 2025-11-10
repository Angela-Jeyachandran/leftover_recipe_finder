import React, { useEffect, useState } from 'react';
import axios from 'axios';
import RecipeCard from "./components/RecipeCard";
import "./App.css";



function App() {
  const [ingredients, setIngredients] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [cuisine, setCuisine] = useState(''); 

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
        `http://localhost:5001/api/recipes?ingredients=${ingredients}&cuisine=${cuisine}`
      );
      setRecipes(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h1>Leftover Recipe Finder</h1>

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



      <button onClick={handleSearch}>Search</button>

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

export default App;
