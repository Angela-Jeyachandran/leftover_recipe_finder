import requests

# Replace with your actual Spoonacular API key
API_KEY = 'your_spoonacular_api_key'

# Ingredients to search for
ingredients = ['eggs', 'cheese', 'spinach']
ingredients_query = ','.join(ingredients)

# API endpoint for searching recipes by ingredients
url = 'https://api.spoonacular.com/recipes/findByIngredients'

# Parameters for the request
params = {
    'ingredients': ingredients_query,
    'number': 10,  # Number of recipes to return
    'ranking': 1,  # 1 = maximize used ingredients, 2 = minimize missing ingredients
    'ignorePantry': True,
    'apiKey': API_KEY
}

# Make the request
response = requests.get(url, params=params)

# Check for success
if response.status_code == 200:
    recipes = response.json()
    for i, recipe in enumerate(recipes, start=1):
        print(f"{i}. {recipe['title']}")
        print(f"   Used Ingredients: {[ing['name'] for ing in recipe['usedIngredients']]}")
        print(f"   Missed Ingredients: {[ing['name'] for ing in recipe['missedIngredients']]}")
        print(f"   Recipe ID: {recipe['id']}")
        print(f"   Image URL: {recipe['image']}")
        print()
else:
    print(f"Error: {response.status_code} - {response.text}")



