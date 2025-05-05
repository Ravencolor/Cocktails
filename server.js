// Importation des modules nécessaires
const express = require('express');
const path = require('path');
const sqlite3 = require("sqlite3").verbose();
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 3000;

// Connexion à la base de données SQLite
const db = new sqlite3.Database('./cocktails.db');

// Middleware pour servir les fichiers statiques, analyser les JSON et gérer les cookies
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(cookieParser());

// Middleware pour vérifier l'authentification
app.use((req, res, next) => {
    if (req.path === '/login' || req.path === '/signup' || req.path.startsWith('/api')) {
        return next();
    }
    const authToken = req.cookies.authToken;
    if (!authToken) {
        return res.redirect('/login');
    }
    next();
});

// Route pour récupérer les ingrédients depuis la base de données
app.get("/api/ingredients", (req, res) => {
    const query = "SELECT * FROM ingredients";
    db.all(query, [], (err, rows) => {
        if (err) {
            throw err;
        }
        res.json(rows);
    });
});

// Route pour la page d'accueil
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route pour la page du jeu
app.get('/jeu', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'jeu.html'));
});

// Route pour valider un cocktail
app.post("/api/validate-cocktail", (req, res) => {
    const cocktailIngredients = req.body.ingredients;

    console.log("Ingrédients reçus :", cocktailIngredients);

    const query = `
        SELECT c.id, c.name, ci.ingredient_id, i.name AS ingredient_name, ci.quantity 
        FROM cocktails c
        JOIN cocktail_ingredients ci ON c.id = ci.cocktail_id
        JOIN ingredients i ON ci.ingredient_id = i.id
    `;
    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: "Erreur de base de données" });
        }

        const cocktails = {};
        rows.forEach(row => {
            if (!cocktails[row.id]) {
                cocktails[row.id] = { name: row.name, ingredients: [] };
            }
            cocktails[row.id].ingredients.push({
                name: row.ingredient_name,
                quantity: row.quantity
            });
        });

        const cocktailMatch = Object.values(cocktails).find(cocktail => {
            return matchCocktail(cocktail.ingredients, cocktailIngredients);
        });

        if (cocktailMatch) {
            res.json({
                message: `Bien joué ! tu as créé ${cocktailMatch.name}`,
                success: true,
                cocktailName: cocktailMatch.name // Ajout du nom du cocktail
            });
        } else {
            res.json({
                message: "Bien joué... tu as créé une étrange mixture...",
                success: false
            });
        }
    });
});

// Fonction pour comparer les ingrédients d'un cocktail
function matchCocktail(databaseIngredients, inputIngredients) {
    if (databaseIngredients.length !== inputIngredients.length) {
        return false;
    }

    return databaseIngredients.every(dbIngredient => {
        const userIngredient = inputIngredients.find(userIng =>
            userIng.name.toLowerCase() === dbIngredient.name.toLowerCase()
        );

        if (!userIngredient) return false;

        const dbQuantity = parseQuantity(dbIngredient.quantity);
        const userQuantity = parseQuantity(userIngredient.quantity);

        return dbQuantity === userQuantity;
    });
}

// Fonction pour analyser les quantités
function parseQuantity(quantity) {
    if (typeof quantity === "number") {
        return quantity;
    }
    if (typeof quantity === "string") {
        const match = quantity.match(/[\d.]+/);
        return match ? parseFloat(match[0]) : 0;
    }
    return 0;
}

// Route pour la page des recettes
app.get('/livre-des-recettes', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'recettes.html'));
});

// Route pour récupérer les cocktails depuis la base de données
app.get('/api/cocktails', (req, res) => {
    const query = `
        SELECT c.id, c.name AS cocktail_name, c.description, c.instructions, i.name AS ingredient_name, ci.quantity
        FROM cocktails c
        JOIN cocktail_ingredients ci ON c.id = ci.cocktail_id
        JOIN ingredients i ON ci.ingredient_id = i.id
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Erreur de requête SQL:', err);
            return res.status(500).json({ message: "Erreur de base de données" });
        }

        const cocktails = {};

        rows.forEach(row => {
            if (!cocktails[row.id]) {
                cocktails[row.id] = {
                    id: row.id,
                    name: row.cocktail_name,
                    description: row.description,
                    ingredients: [],
                    instructions: row.instructions
                };
            }
            cocktails[row.id].ingredients.push({
                name: row.ingredient_name,
                quantity: row.quantity
            });
        });

        const cocktailArray = Object.values(cocktails);

        res.json(cocktailArray);
    });
});

// Route pour la page de connexion
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Route pour la page d'inscription
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

// Route pour gérer la connexion
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const query = "SELECT * FROM users WHERE username = ? AND password = ?";
    db.get(query, [username, password], (err, row) => {
        if (err) {
            return res.status(500).json({ message: "Erreur de base de données" });
        }
        if (row) {
            res.json({ message: "Connexion réussie", success: true });
        } else {
            res.json({ message: "Nom d'utilisateur ou mot de passe incorrect", success: false });
        }
    });
});

// Route pour gérer l'inscription
app.post('/api/signup', (req, res) => {
    const { username, password } = req.body;

    const checkQuery = "SELECT * FROM users WHERE username = ?";
    db.get(checkQuery, [username], (err, row) => {
        if (err) {
            return res.status(500).json({ message: "Erreur de base de données" });
        }
        if (row) {
            return res.json({ message: "Le nom d'utilisateur est déjà pris", success: false });
        }

        const insertQuery = "INSERT INTO users (username, password) VALUES (?, ?)";
        db.run(insertQuery, [username, password], function (err) {
            if (err) {
                return res.status(500).json({ message: "Erreur de base de données" });
            }
            res.json({ message: "Inscription réussie", success: true });
        });
    });
});

// Lancement du serveur
app.listen(PORT, () => {
    console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});
