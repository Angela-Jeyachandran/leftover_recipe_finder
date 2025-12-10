# Leftover Recipe Finder Application  

## Developer Guide (Programmer’s Documentation)

---

## 1. Overview

The Leftover Recipe Application is a full-stack web application designed to help users generate meal ideas based on ingredients they already have. The system prioritizes reducing food waste by ranking recipes according to ingredient overlap, optional cuisine preference, and basic scoring heuristics.

The project consists of:
- A React frontend that handles user interaction and presentation
- A Node.js / Express backend that communicates with the Spoonacular API
- Lightweight in-memory caching to reduce external API calls

This document is intended for developers taking over or extending the project, and assumes the reader has already followed the User Guide to run the application.

---

## 2. Final Implemented Features (Condensed Specs)

### Implemented
- Ingredient-based recipe search
- Optional cuisine filtering
- Adjustable number of returned recipes
- Recipe ranking by ingredient match
- Built-in pantry staples
- Ingredient substitution suggestions
- Frontend-backend API integration
- Response caching to reduce API usage

### Not Implemented
- Dietary restriction filtering (vegetarian, vegan, gluten-free, etc.)
- Maximum cooking time filtering
- Bookmarking recipes for later retrieval
- Persistent storage using JSON files or a database
- User accounts and user-specific recipe lists
- Alternative ranking strategies (e.g., calorie-based ranking)
- UI controls for saving and revisiting recipes
- Backend endpoints for bookmark management

---

## 3. Documentation Style

This project uses a **Google-style, human-readable documentation format** for all modules, components, and core functions. The emphasis is on developer clarity rather than auto-generated documentation.

This includes:
- File-level docstrings
- Function and component descriptions
- Inline comments for non-obvious logic
- Paragraph-level comments explaining logical blocks
- TODO and GOTCHA notes where appropriate

---

## 4. Install, Deployment, and Admin Notes

Assumes the developer has already:
- Installed Node.js
- Installed project dependencies
- Read the User Guide (`docs/README.md`)

### Backend (API Server)

Run from project root:

```bash
node server.js
```

Environment requirements:

API_KEY=your_spoonacular_api_key_here


### Frontend (React App)

Run from `client/`:

```bash
npm start
```


### Important Notes

* Backend runs on `localhost:5001`
* Frontend runs on `localhost:3000`
* API URLs are currently hardcoded for local development

---

## 5. User Interaction & Code Walkthrough

### User Flow (High-Level)

1. User lands on the Home page
2. User clicks **Start Cooking**
3. User enters ingredients on the Recipes page
4. Frontend sends a request to the backend
5. Backend queries Spoonacular and ranks results
6. Recipes are displayed as cards

---

## 6. Frontend Walkthrough

### App.js

**Purpose:** Top-level routing component
Defines application routes:

* `/`           directs to Home
* `/recipes`    directs to RecipesPage

Contains no UI logic or state.

---

### Home.js

**Purpose:** Entry point for the user experience

Responsibilities:

* Display application branding
* Navigate user into recipe flow using React Router

Stateless by design.

---

### RecipesPage.js

**Purpose:** Core interaction logic

Handles:

* User input (ingredients, cuisine, recipe count)
* API communication via Axios
* Rendering recipe results

Key state variables:

* `ingredients`
* `cuisine`
* `recipeCount`
* `recipes`

Backend requests are sent to:

GET /api/recipes

Commented-out placeholder data exists for early UI testing and is intentionally preserved for reference.

---

### RecipeCard.js

**Purpose:** Presentation component

Displays:

* Title
* Image
* Used vs missed ingredients
* Cook time

No business logic lives here.

---

## 7. Backend Walkthrough

### server.js

**Purpose:** API middleware layer

Acts as the bridge between:

* React frontend
* Spoonacular external API

---

### Key Endpoints

#### Health Check

GET /

Returns a basic confirmation string.

---

#### Recipe Search

GET /api/recipes

Query parameters:

* `ingredients` (required)
* `cuisine` (optional)
* `number` (optional, default = 3)

Responsibilities:

* Normalize ingredient input
* Add pantry staples
* Deduplicate ingredients
* Query Spoonacular
* Rank recipes
* Cache responses

---

#### Ingredient Substitutions

GET /api/substitutions

Uses:

* Local fallback dictionary (preferred)
* Spoonacular substitution endpoint (secondary)

In-memory caching reduces repeated calls.

---

## 8. Known Issues

### Minor Issues

* Substitution matching does not handle pluralization well
* Hardcoded localhost API URLs
* Errors are logged to console but not surfaced in UI

### Major Issues

* In-memory cache resets on server restart
* Scalability limitations for large recipe datasets

---

## 9. Performance & Computational Considerations

* All logic is executed in-memory
* Recipe ranking is linear per response
* Suitable for small to medium workloads

Potential improvements:

* Persistent cache (Redis)
* Server-side pagination
* Ingredient indexing structures

---

## 10. Future Work

Potential extensions:

* User profiles and saved preferences
* Recipe favoriting
* Machine-learning-based ranking
* Mobile-friendly UI enhancements

---

## 11. Project Organization Notes

### archive/

Contains experimental files retained for development context and transparency. These files are not part of the active application.

---

## 12. Ongoing Development & Maintenance (Optional)

If this project were extended long-term:

* Add unit tests for backend routes
* Abstract API communication into services
* Isolate ranking logic for easier experimentation
* Replace hardcoded URLs with environment variables