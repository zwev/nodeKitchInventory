document.addEventListener('DOMContentLoaded', () => {
  const searchForm = document.getElementById('searchForm');
  const ingredientInput = document.getElementById('ingredient');
  const recipesContainer = document.getElementById('recipesContainer');
  const modalBody = document.getElementById('modalRecipeDetails');

  // Handle form submission
  searchForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent the form from reloading the page

    const ingredient = ingredientInput.value.trim();
    if (!ingredient) {
      alert('Please enter an ingredient');
      return;
    }

    // Clear previous results, display loading message
    recipesContainer.innerHTML = '<p>Loading recipes...</p>';

    try {
      const response = await fetch(`/recipes/search?ingredient=${encodeURIComponent(ingredient)}`);
      const data = await response.json();
      
      if (data.recipes && data.recipes.length > 0) {
        const resultsHTML = data.recipes.map(recipe => `
          <li class="mb-3">
            <a href="#" class="recipe-link" data-id="${recipe.idMeal}" data-bs-toggle="modal" data-bs-target="#recipeModal">
              <h3>${recipe.strMeal}</h3>
              <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}" class="img-thumbnail" width="150">
            </a>
          </li>
        `).join('');
        recipesContainer.innerHTML = `<ul class="list-unstyled">${resultsHTML}</ul>`;
      } else {
        recipesContainer.innerHTML = '<p>No recipes found.</p>';
      }

      // Attach click event to recipe links
      document.querySelectorAll('.recipe-link').forEach(link => {
        link.addEventListener('click', async (event) => {
          event.preventDefault();
          const recipeId = link.getAttribute('data-id');

          try {
            const recipeResponse = await fetch(`/recipes/${recipeId}`);
            const recipeData = await recipeResponse.json();

            // Populate modal with recipe details
            let ingredientsHTML = '';
            for (let i = 1; i <= 20; i++) {
              const ingredient = recipeData.recipe[`strIngredient${i}`];
              const measure = recipeData.recipe[`strMeasure${i}`];
              if (ingredient) {
                ingredientsHTML += `
                    <li class="ingredient-item">
                    <span class="ingredient-measure">${measure || ''}</span>
                    <span class="ingredient-name">${ingredient}</span>
                    </li>`;
              }
            }

            modalBody.innerHTML = `
              <h1 class="text-center">${recipeData.recipe.strMeal}</h1>
              <img src="${recipeData.recipe.strMealThumb}" alt="${recipeData.recipe.strMeal}" class="img-fluid mb-3 rounded">
              <h2 class="mt-4">Ingredients:</h2>
              <div class="d-flex justify-content-center">
                <ul class="list-unstyled">
                 ${ingredientsHTML}
                </ul>
              </div>
              <h2 class="mt-4">Instructions:</h2>
              <p>${recipeData.recipe.strInstructions}</p>
            `;
          } catch (error) {
            console.error('Error fetching recipe details:', error);
            modalBody.innerHTML = '<p>Error loading recipe details. Please try again later.</p>';
          }
        });
      });
    } catch (error) {
      console.error('Error fetching recipes:', error);
      recipesContainer.innerHTML = '<p>Error fetching recipes. Please try again later.</p>';
    }
  });
});