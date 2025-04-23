document.addEventListener('DOMContentLoaded', () => {
  const modalBody = document.getElementById('modalRecipeDetails');

  // Attach click event to recipe links
  document.querySelectorAll('.recipe-link').forEach(link => {
    link.addEventListener('click', async (event) => {
      event.preventDefault();
      const recipeId = link.getAttribute('data-id');

      try {
        const response = await fetch(`/recipes/${recipeId}`);
        const data = await response.json();

        // Populate modal with recipe details
        modalBody.innerHTML = `
          <h1>${data.recipe.strMeal}</h1>
          <img src="${data.recipe.strMealThumb}" alt="${data.recipe.strMeal}" class="img-fluid mb-3">
          <h2>Ingredients:</h2>
          <ul class="no-bullets">
            ${Array.from({ length: 20 }).map((_, i) => {
              const ingredient = data.recipe[`strIngredient${i + 1}`];
              const measure = data.recipe[`strMeasure${i + 1}`];
              return ingredient ? `<li>${ingredient} - ${measure}</li>` : '';
            }).join('')}
          </ul>
          <h2>Instructions:</h2>
          <p>${data.recipe.strInstructions}</p>
        `;
      } catch (error) {
        console.error('Error fetching recipe details:', error);
        modalBody.innerHTML = '<p>Error loading recipe details. Please try again later.</p>';
      }
    });
  });
});