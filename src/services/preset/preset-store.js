const STORAGE_KEY = "science-lens-recipes-v1";

export function saveRecipe(recipe) {
  const recipes = listRecipes();
  const next = {
    ...recipe,
    id: recipe.id || `recipe-${Date.now()}`,
    savedAt: new Date().toISOString()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([next, ...recipes].slice(0, 20)));
  return next;
}

export function listRecipes() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function getLatestRecipe() {
  return listRecipes()[0] || null;
}

