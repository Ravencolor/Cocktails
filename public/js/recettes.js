// Tableau pour stocker tous les cocktails récupérés depuis l'API
let allCocktails = [];

// Tableau pour stocker tous les ingrédients uniques
let allIngredients = [];

// Récupération des cocktails depuis l'API
fetch('/api/cocktails')
    .then(response => {
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des cocktails');
        }
        return response.json();
    })
    .then(cocktails => {
        // Stockage des cocktails et extraction des ingrédients
        allCocktails = cocktails;
        extractIngredients(cocktails); // Extraction des ingrédients uniques
        displayCocktails(cocktails); // Affichage initial des cocktails
    })
    .catch(error => {
        console.error('Erreur lors du chargement des cocktails:', error);
    });

// Fonction pour extraire les ingrédients uniques des cocktails
function extractIngredients(cocktails) {
    const ingredientSet = new Set();
    cocktails.forEach(cocktail => {
        cocktail.ingredients.forEach(ingredient => {
            ingredientSet.add(ingredient.name);
        });
    });
    allIngredients = Array.from(ingredientSet);
    populateIngredientFilter(); // Remplissage des cases à cocher pour les ingrédients
}

// Fonction pour remplir les cases à cocher des ingrédients
function populateIngredientFilter() {
    const ingredientContainer = document.getElementById('filter-ingredients');
    allIngredients.forEach(ingredient => {
        const label = document.createElement('label');
        label.classList.add('flex', 'items-center', 'gap-2');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = ingredient;
        checkbox.classList.add('ingredient-checkbox');

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(ingredient));
        ingredientContainer.appendChild(label);
    });

    // Ajout d'un écouteur pour appliquer les filtres en temps réel
    ingredientContainer.addEventListener('change', applyFilters);
}

// Fonction pour afficher les cocktails dans le conteneur
function displayCocktails(cocktails) {
    const cocktailsContainer = document.getElementById('cocktails-container');
    cocktailsContainer.innerHTML = ''; // Nettoyage du conteneur

    cocktails.forEach(cocktail => {
        const cocktailDiv = document.createElement('div');
        cocktailDiv.classList.add('bg-gray-800', 'p-4', 'rounded-lg');

        // Image du cocktail
        const imageDiv = document.createElement('div');
        imageDiv.classList.add('bg-gray-700', 'h-40', 'rounded-lg', 'mb-4', 'flex', 'items-center', 'justify-center');
        const image = document.createElement('img');
        image.src = `./image/${cocktail.name.toLowerCase().replace(/\s+/g, '_')}.jpg`;
        image.alt = `Image de ${cocktail.name}`;
        image.classList.add('h-full', 'w-full', 'object-cover', 'rounded-lg');
        image.onerror = () => {
            image.src = './images/default.jpg'; // Image par défaut en cas d'erreur
        };
        imageDiv.appendChild(image);
        cocktailDiv.appendChild(imageDiv);

        // Catégorie du cocktail
        const categoryDiv = document.createElement('div');
        categoryDiv.classList.add('flex', 'justify-between', 'items-center', 'mb-2');
        categoryDiv.innerHTML = `<span class="bg-gray-600 text-white text-xs px-2 py-1 rounded">${cocktail.category || 'Cocktail'}</span>`;
        cocktailDiv.appendChild(categoryDiv);

        // Titre du cocktail
        const cocktailTitle = document.createElement('h2');
        cocktailTitle.classList.add('text-xl', 'font-bold', 'mb-2');
        cocktailTitle.textContent = cocktail.name;
        cocktailDiv.appendChild(cocktailTitle);

        // Description du cocktail
        const cocktailDescription = document.createElement('p');
        cocktailDescription.classList.add('text-gray-400', 'mb-4');
        cocktailDescription.textContent = cocktail.description;
        cocktailDiv.appendChild(cocktailDescription);

        // Bouton pour afficher les ingrédients
        const viewRecipeButton = document.createElement('button');
        viewRecipeButton.classList.add('bg-purple-600', 'text-white', 'px-4', 'py-2', 'rounded-lg');
        viewRecipeButton.textContent = 'Voir les ingrédients';
        viewRecipeButton.addEventListener('click', () => {
            alert(`Ingrédients pour ${cocktail.name}:\n` + 
                cocktail.ingredients.map(ingredient => `- ${ingredient.quantity} de ${ingredient.name}`).join('\n'));
        });
        cocktailDiv.appendChild(viewRecipeButton);

        cocktailsContainer.appendChild(cocktailDiv);
    });
}

// Logique pour appliquer les filtres en temps réel
document.getElementById('filter-name').addEventListener('input', applyFilters);
document.getElementById('filter-category').addEventListener('change', applyFilters);

// Fonction pour appliquer les filtres
function applyFilters() {
    const nameFilter = document.getElementById('filter-name').value.toLowerCase();
    const categoryFilter = document.getElementById('filter-category').value;
    const selectedIngredients = Array.from(document.querySelectorAll('.ingredient-checkbox:checked')).map(checkbox => checkbox.value);

    let filteredCocktails = allCocktails;

    // Filtrage par nom
    if (nameFilter) {
        filteredCocktails = filteredCocktails.filter(cocktail => cocktail.name.toLowerCase().includes(nameFilter));
    }

    // Filtrage par catégorie
    if (categoryFilter === 'most-ingredients') {
        filteredCocktails = filteredCocktails.sort((a, b) => b.ingredients.length - a.ingredients.length);
    } else if (categoryFilter === 'least-ingredients') {
        filteredCocktails = filteredCocktails.sort((a, b) => a.ingredients.length - b.ingredients.length);
    } else if (categoryFilter === 'alphabetical') {
        filteredCocktails = filteredCocktails.sort((a, b) => a.name.localeCompare(b.name));
    } else if (categoryFilter === 'reverse-alphabetical') {
        filteredCocktails = filteredCocktails.sort((a, b) => b.name.localeCompare(a.name));
    }

    // Filtrage par ingrédients sélectionnés
    if (selectedIngredients.length > 0) {
        filteredCocktails = filteredCocktails.filter(cocktail =>
            selectedIngredients.every(ingredient =>
                cocktail.ingredients.some(cocktailIngredient => cocktailIngredient.name === ingredient)
            )
        );
    }

    displayCocktails(filteredCocktails); // Mise à jour de l'affichage
}

const cocktailPage = document.getElementById('cocktail-page');
const prevButton = document.getElementById('prev-button');
const nextButton = document.getElementById('next-button');

let cocktails = [];
let currentIndex = 0;

fetch('/api/cocktails')
    .then(response => response.json())
    .then(data => {
        cocktails = data;
        displayCocktail(currentIndex);
    })
    .catch(error => {
        console.error('Erreur lors du chargement des cocktails:', error);
    });

function displayCocktail(index) {
    const cocktail = cocktails[index];

    cocktailPage.innerHTML = `
        <h2>${cocktail.name}</h2>
        <p>${cocktail.description}</p>
        <p><strong>Ingrédients :</strong></p>
        <ul>
            ${cocktail.ingredients.map(ingredient => `<li>${ingredient.quantity} de ${ingredient.name}</li>`).join('')}
        </ul>
        <p><strong>Instructions :</strong></p>
        <p>${cocktail.instructions}</p>
    `;
}

prevButton.addEventListener('click', () => {
    if (currentIndex > 0) {
        currentIndex--;
        displayCocktail(currentIndex);
    }
});

nextButton.addEventListener('click', () => {
    if (currentIndex < cocktails.length - 1) {
        currentIndex++;
        displayCocktail(currentIndex);
    }
});
