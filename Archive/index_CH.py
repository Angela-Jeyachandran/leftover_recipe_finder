import requests
from keys import API_KEY
import json, os
import sys
#import pwinput

USER_FILE = "users.json"

# Gets substitute ingredients for a given ingredient using the Spoonacular API
def get_substitutes(ingredient):
    url = "https://api.spoonacular.com/food/ingredients/substitutes"
    params = {"ingredientName": ingredient, "apiKey": API_KEY}
    response = requests.get(url, params=params)
    if response.status_code == 200:
        data = response.json()
        if data.get("substitutes"):
            return data["substitutes"]
    return []

def search_recipes(ingredients, API_KEY, number=3, cuisine=""): # CH: must be API_KEY!
    # Comma separated string for API
    ingredients_query = ','.join([i.strip() for i in ingredients])

    # API endpoint for searching recipes by ingredients
    url = 'https://api.spoonacular.com/recipes/findByIngredients'

    # Parameters for the request
    params = {
        'ingredients': ingredients_query,
        'number': number,  # Number of recipes to return CH was hardcoded to 3
        'ranking': 1,  # 1 = maximize used ingredients, 2 = minimize missing ingredients
        'ignorePantry': True,
        'apiKey': API_KEY
    } 


    # Make the request
    response = requests.get(url, params=params)

    # Check for success
    if response.status_code == 200:
        recipes = response.json()
        
        
        # Filter recipes by cuisine if the user entered one
        if cuisine:
            filtered_recipes = []
            for recipe in recipes:
                info_url = f"https://api.spoonacular.com/recipes/{recipe['id']}/information"
                info_params = {'apiKey': API_KEY}
                info_response = requests.get(info_url, params=info_params)
                if info_response.status_code == 200:
                    info = info_response.json()
                    # check if the cuisine matches any of the cuisines listed in the recipe
                    if cuisine.lower() in [c.lower() for c in info.get('cuisines', [])]:
                        filtered_recipes.append(recipe)
                # stop once we have 3 matching recipes
                if len(filtered_recipes) == 3:
                    break
                
            
            if filtered_recipes:
                recipes = filtered_recipes
            else:
                print(f"No recipes found for cuisine: {cuisine}")
                recipes = []

        
        for i, recipe in enumerate(recipes, start=1):
            print(f"{i}. {recipe['title']}")
            used = [ing['name'] for ing in recipe['usedIngredients']]
            missed = [ing['name'] for ing in recipe['missedIngredients']]
            print(f"   Used Ingredients: {used}")
            print(f"   Missed Ingredients:")
            # Creates an instacart link for the missing ingredients 
            for ing in missed:
                instacart_link = f"https://www.instacart.com/store/search?q={ing.replace(' ', '+')}"
                print(f"     - {ing} → {instacart_link}")
                
                # substitution possibilities
                substitutes = get_substitutes(ing)
                if substitutes:
                    print(f"       Substitutes: {', '.join(substitutes)}")
                else:
                    sub_link = f"https://www.google.com/search?q={ing.replace(' ', '+')}+ingredient+substitute"
                    print(f"       Find substitutes → {sub_link}")
            print(f"   Recipe ID: {recipe['id']}")
            print(f"   Image URL: {recipe['image']}")
            print()
            print()
    else:
        print(f"Error: {response.status_code} - {response.text}")

def main_menu():
    
    print("Welcome to the Leftover Recipe Generator!")
    print("-----------------------------------------------------")
    print()
    # User can choose to search or exit app
    print("1. Search for recipes")
    print("2. Exit")
    print()
    print("-----------------------------------------------------")
    choice = input("Choose an option (1 or 2): ").strip()
    print()
    
    # if 1 entered user can search
    if choice == "1":
        # Ask user for ingredients
        ingredients_input = input("Enter ingredients you have (separated by commas): ").strip()
        ingredients = [i.strip() for i in ingredients_input.split(",")]

        # Ask user for optional cuisine (CH: show all options)
        print("Cuisines: American, Italian, Chinese, Mexican, Indian, French, Thai, Japanese, Mediterranean, etc.")
        cuisine = input("Enter a cuisine (or leave blank for any): ").strip()

        # Ask user how many recipes to display
        number_input = input("How many recipes would you like to see? (default 3): ").strip()
        number = int(number_input) if number_input.isdigit() else 3
        print("-----------------------------------------------------")
        print()

        # Call the refactored function
        search_recipes(ingredients, API_KEY, number=number, cuisine=cuisine)
    
    # if 2 entered app ends
    elif choice == "2":
        print()
        print("Thanks for using the Leftover Recipe Generator! Come back soon!")
        sys.exit(0)  
        
    else:
        print("Invalid choice. please try again.\n")

if __name__ == "__main__":
    main_menu()
    
''' In case you want a list of cuisines for reference:
cuisines = [
    "African",
    "American", 
    "British",
    "Cajun",
    "Caribbean",
    "Chinese",
    "Eastern European",
    "European",
    "French",
    "German",
    "Greek",
    "Indian",
    "Irish",
    "Italian",
    "Japanese",
    "Jewish",
    "Korean",
    "Latin American",
    "Mediterranean",
    "Mexican",
    "Middle Eastern",
    "Nordic",
    "Southern",
    "Spanish",
    "Thai",
    "Vietnamese"
]'''
