let ingredientsData = [];
let cocktailIngredients = [];

async function fetchIngredients() {
    try {
        const response = await fetch("http://localhost:3000/api/ingredients");
        ingredientsData = await response.json();
        generateIngredientsList(ingredientsData);
    } catch (error) {
        console.error("Erreur lors de la récupération des ingrédients:", error);
    }
}

function generateIngredientsList(ingredients) {
    const ingredientsContainer = document.getElementById("ingredients");
    ingredientsContainer.innerHTML = '';

    ingredients.forEach((ingredient, index) => {
        const ingredientElement = document.createElement("div");
        ingredientElement.classList.add("ingredient");
        ingredientElement.setAttribute("draggable", true);
        ingredientElement.setAttribute("data-index", index);

        ingredientElement.innerHTML = `${ingredient.name} (${ingredient.quantity})`;

        ingredientElement.addEventListener("dragstart", dragStart);

        ingredientsContainer.appendChild(ingredientElement);
    });
}

function dragStart(event) {
    event.dataTransfer.setData("ingredientIndex", event.target.getAttribute("data-index"));
}

const glass = document.getElementById("verre");
glass.addEventListener("dragover", (event) => {
    event.preventDefault();
});

glass.addEventListener("drop", (event) => {
    event.preventDefault();

    const index = event.dataTransfer.getData("ingredientIndex");
    const ingredient = ingredientsData[index];

    addOrUpdateIngredientInGlass(ingredient);
});

function addOrUpdateIngredientInGlass(ingredient) {
    const glassList = document.getElementById("ingredients-liste");

    const existingIngredient = cocktailIngredients.find(item => item.name === ingredient.name);

    if (existingIngredient) {
        existingIngredient.quantity += parseInt(ingredient.quantity);
    } else {
        cocktailIngredients.push({
            name: ingredient.name,
            quantity: parseInt(ingredient.quantity)
        });
    }

    updateGlassIngredientList();
}

function updateGlassIngredientList() {
    const glassList = document.getElementById("ingredients-liste");
    glassList.innerHTML = '';

    cocktailIngredients.forEach((ingredient, index) => {
        const ingredientElement = document.createElement("div");
        ingredientElement.classList.add("ingredient-liste-item");
        ingredientElement.innerHTML = `${ingredient.name} (${ingredient.quantity})`;

        const trashIcon = document.createElement("i");
        trashIcon.classList.add("fas", "fa-trash");
        trashIcon.addEventListener("click", () => removeIngredient(index));

        ingredientElement.appendChild(trashIcon);

        glassList.appendChild(ingredientElement);
    });
}

function removeIngredient(index) {
    cocktailIngredients.splice(index, 1);

    updateGlassIngredientList();
}

fetchIngredients();

/**
 * Valide un cocktail en envoyant une requête POST à l'API et met à jour l'interface utilisateur en fonction de la réponse.
 * 
 * Cette fonction effectue les étapes suivantes :
 * 1. Prépare une liste des ingrédients du cocktail avec leurs noms et quantités.
 * 2. Envoie une requête POST à l'API pour valider le cocktail.
 * 3. Cache les éléments de l'interface utilisateur liés au verre, au contenu et au bouton de validation.
 * 4. Affiche un message de résultat dans une nouvelle section avec un bouton pour fermer et réinitialiser l'interface.
 * 5. Réinitialise la liste des ingrédients du cocktail après la fermeture du message.
 * 
 * @async
 * @function validateCocktail
 * @returns {Promise<void>} Une promesse qui est résolue une fois que la validation et la mise à jour de l'interface sont terminées.
 * 
 * @throws {Error} Si une erreur survient lors de la requête à l'API ou de la mise à jour de l'interface utilisateur.
 */
async function validateCocktail() {
    const ingredients = cocktailIngredients.map(ingredient => ({
        name: ingredient.name,
        quantity: ingredient.quantity
    }));
    
    console.log("Cocktail envoyé :", ingredients);

    try {
        const response = await fetch("http://localhost:3000/api/validate-cocktail", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ ingredients })
        });

        const data = await response.json();

        // Hide the "verre", "contenue", and "validate-btn-container" divs
        document.getElementById("verre").style.display = "none";
        document.getElementById("contenue").style.display = "none";
        document.getElementById("validate-btn-container").style.display = "none";

        // Create a new div to display the content initially in the popup
        const resultContainer = document.createElement("div");
        resultContainer.classList.add("flex", "flex-col", "items-center", "justify-center", "space-y-6");

        const message = document.createElement("p");
        message.innerHTML = data.message;
        resultContainer.appendChild(message);

        if (data.image) {
            const image = document.createElement("img");
            image.src = `../public/image/${data.image}`;
            image.alt = "Image du cocktail";
            image.classList.add("w-64", "h-auto", "rounded", "shadow-md");
            resultContainer.appendChild(image);
        }        

        const closeButton = document.createElement("button");
        closeButton.classList.add("inline-flex", "items-center", "justify-center", "gap-2", "whitespace-nowrap", "rounded-md", "text-sm", "font-medium", "ring-offset-background", "transition-colors", "focus-visible:outline-none", "focus-visible:ring-2", "focus-visible:ring-ring", "focus-visible:ring-offset-2", "disabled:pointer-events-none", "disabled:opacity-50", "[&_svg]:pointer-events-none", "[&_svg]:size-4", "[&_svg]:shrink-0", "bg-primary", "hover:bg-primary/90", "h-10", "px-4", "py-2", "bg-gradient-to-r", "from-purple-600", "to-pink-600", "hover:from-purple-700", "hover:to-pink-700", "text-white");
        closeButton.innerHTML = "Fermer";
        closeButton.addEventListener("click", () => {
            resultContainer.style.display = "none";
            document.getElementById("verre").style.display = "flex";
            document.getElementById("contenue").style.display = "flex";
            document.getElementById("validate-btn-container").style.display = "flex";
            
            // Reset the ingredient list
            cocktailIngredients = [];
            updateGlassIngredientList();
        });

        resultContainer.appendChild(closeButton);

        document.getElementById("validate-btn-container").parentElement.appendChild(resultContainer);

    } catch (error) {
        console.error("Erreur lors de la validation du cocktail :", error);
    }
}

const validateBtn = document.getElementById('validate-btn');

validateBtn.addEventListener('click', () => {
    validateCocktail();
});