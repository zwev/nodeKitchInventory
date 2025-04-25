document.addEventListener('DOMContentLoaded', () => {
  const searchForm = document.getElementById('searchForm');
  const ingredientInput = document.getElementById('ingredient');
  const recipesContainer = document.getElementById('recipesContainer');
  const modalBody = document.getElementById('modalRecipeDetails');
  const saveFavoriteButton = document.getElementById('saveFavoriteButton');

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

  // Render the recipe list
  function renderRecipes(recipes) {
    if (recipes.length > 0) {
      const resultsHTML = recipes.map(recipe => `
        <div class="col-md-2 mb-4">
          <div class="card h-100">
            <img src="${recipe.strMealThumb}" class="card-img-top" alt="${recipe.strMeal}">
            <div class="card-body d-flex flex-column">
              <h5 class="card-title text-center">${recipe.strMeal}</h5>
              <div class="mt-auto">
                <button type="button" class="btn btn-primary w-75 recipe-link" data-id="${recipe.idMeal}" data-bs-toggle="modal" data-bs-target="#recipeModal">
                  View Details
                </button>
              </div>
            </div>
          </div>
        </div>
      `).join('');
      recipesContainer.innerHTML = `<div class="row">${resultsHTML}</div>`;
      attachRecipeLinkListeners();
    } else {
      recipesContainer.innerHTML = '<p>No recipes found.</p>';
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

    // Update the "Save as Favorite" button
    saveFavoriteButton.setAttribute('data-id', recipe.idMeal);
    saveFavoriteButton.setAttribute('data-name', recipe.strMeal);
    saveFavoriteButton.setAttribute('data-image', recipe.strMealThumb);

    checkFavoriteStatus(recipe.idMeal);
  }

  async function checkFavoriteStatus(recipeId) {
    try {
      const data = await fetchData(`/favorites/${recipeId}`);
      if (data) {
          saveFavoriteButton.classList.remove('btn-success');
          saveFavoriteButton.classList.add('btn-danger');
          saveFavoriteButton.textContent = 'Favorited';
          saveFavoriteButton.disabled = true;
        } else {
          saveFavoriteButton.classList.remove('btn-danger');
          saveFavoriteButton.classList.add('btn-success');
          saveFavoriteButton.textContent = 'Save as Favorite';
          saveFavoriteButton.disabled = false;
        }
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  }
  

  // Handle saving a recipe as a favorite
  async function handleSaveFavorite() {
    const recipeId = saveFavoriteButton.getAttribute('data-id');
    const recipeName = saveFavoriteButton.getAttribute('data-name');
    const recipeImage = saveFavoriteButton.getAttribute('data-image');

    try {
      const response = await fetch('/favorites/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: recipeId,
          name: recipeName,
          url: recipeImage,
        }),
      });

      if (response.ok) {
        button.classList.remove('btn-success');
        button.classList.add('btn-danger');
        button.textContent = 'Favorited';
        button.disabled = true;
      } else {
        const error = await response.text();
        alert(`Failed to save favorite: ${error}`);
      }
    } catch (error) {
      console.error('Error saving favorite:', error);
      alert('An error occurred. Please try again.');
    }
  }

  // Attach event listeners to recipe links
  function attachRecipeLinkListeners() {
    document.querySelectorAll('.recipe-link').forEach(link => {
      link.addEventListener('click', async (event) => {
        event.preventDefault();
        const recipeId = link.getAttribute('data-id');

        try {
          const data = await fetchData(`/recipes/${recipeId}`);
          populateModal(data.recipe);
        } catch (error) {
          modalBody.innerHTML = '<p>Error loading recipe details. Please try again later.</p>';
        }
      });
    });
  }

  // Handle form submission
  async function handleSearch(event) {
    event.preventDefault(); // Prevent the form from reloading the page

    let ingredient = '';
    if (event.target === searchForm) {
      // Get the ingredient from the text input
      ingredient = ingredientInput.value.trim();
    } else if (event.target === dropdownSearchForm) {
      // Get the ingredient from the dropdown
      ingredient = ingredientDropdown.value;
    }

    if (!ingredient) {
      alert('Please select or enter an ingredient');
      return;
    }

    // Clear previous results, display loading message
    recipesContainer.innerHTML = '<p>Loading recipes...</p>';

    try {
      const data = await fetchData(`/recipes/search?ingredient=${encodeURIComponent(ingredient)}`);
      renderRecipes(data.recipes || []);
    } catch (error) {
      recipesContainer.innerHTML = '<p>Error fetching recipes. Please try again later.</p>';
    }
  }

  // Attach event listeners to both forms
  searchForm.addEventListener('submit', handleSearch);
  dropdownSearchForm.addEventListener('submit', handleSearch);

  // Attach event listener to the "Save as Favorite" button
  saveFavoriteButton.addEventListener('click', handleSaveFavorite);
});