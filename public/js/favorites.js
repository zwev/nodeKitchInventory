const modalBody = document.getElementById('modalRecipeDetails');

document.addEventListener('DOMContentLoaded', () => {
  const modalRecipeIdInput = document.getElementById('modalRecipeId'); // Hidden input in the modal

  const buttons = document.querySelectorAll('.recipe-link');
  buttons.forEach(button => {
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      const recipeId = button.getAttribute('data-id'); // Get the recipe ID from the button
      console.log(`Recipe link clicked: ${recipeId}`);

      try {
        const data = await fetchData(`/recipes/${recipeId}`);
        populateModal(data.recipe);

        // Set the recipeId in the hidden input field of the modal form
        modalRecipeIdInput.value = recipeId;
      } catch (error) {
        const modalBody = document.getElementById('modalRecipeDetails');
        modalBody.innerHTML = '<p>Error loading recipe details. Please try again later.</p>';
      }
    });
  });
});

    // Fetch data from the server
    async function fetchData(url) {
        try {
          const response = await fetch(url);
          if (!response.ok) throw new Error(`Error: ${response.statusText}`);
          return await response.json();
        } catch (error) {
          console.error('Error fetching data:', error);
          throw error;
        }
      }

  // Populate the modal with recipe details
  function populateModal(recipe) {
    let ingredientsHTML = '';
    for (let i = 1; i <= 20; i++) {
      const ingredient = recipe[`strIngredient${i}`];
      const measure = recipe[`strMeasure${i}`];
      if (ingredient) {
        ingredientsHTML += `
          <li class="ingredient-item">
            <span class="ingredient-measure">${measure || ''}</span>
            <span class="ingredient-name">${ingredient}</span>
          </li>`;
      }
    }
    
    modalBody.innerHTML = `
      <h1 class="text-center">${recipe.strMeal}</h1>
      <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}" class="img-fluid mb-3 rounded">
      <h2 class="mt-4">Ingredients:</h2>
      <div class="d-flex justify-content-center">
        <ul class="list-unstyled">
          ${ingredientsHTML}
        </ul>
      </div>
      <h2 class="mt-4">Instructions:</h2>
      <p>${recipe.strInstructions}</p>
    `;
  }