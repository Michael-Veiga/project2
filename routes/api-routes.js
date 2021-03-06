const axios = require('axios');
const passport = require('../config/passport');
const db = require('../models');
require('dotenv').config();

module.exports = (app) => {
  // If the user has valid credentials, they'll be allowed to access restricted routes
  app.post('/api/index', passport.authenticate('local'), (req, res) => {
    res.json(req.user);
  });
  // If the user is successfully created then log them in, otherwise, throw an error.
  app.post('/api/signup', (req, res) => {
    db.User.create({
      email: req.body.email,
      password: req.body.password,
    })
      .then(() => {
        res.redirect(307, '/api/index');
      })
      .catch((err) => {
        res.status(401).json(err);
      });
  });
  // Route for logging a user out.
  app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
  });
  // Route for getting info about the user.
  app.post('/api/user_data', (req, res) => {
    if (!req.user) {
      res.json({});
    } else {
      res.json({
        email: req.user.email,
        id: req.user.id,
      });
    }
  });
  // Route for saving recipe to db
  // needs to reference user who saved it
  app.post('/api/recipes', (req, res) => {
    // testing console so linter won't throw errors
    console.log(req.body);
    db.Recipe.create({
      name: req.body.title,
      recipeId: req.body.recipeId,
      image: req.body.image,
      UserId: req.body.userId,
    })
      .then(() => {
        res.status(200).json({ message: 'Recipe added' });
      })
      .catch((err) => {
        console.log(err);
        res.status(404).json(err);
      });
  });
  // Route for saving shopping lists to db
  // needs to reference user who saved it
  // this will make sure that the current user's list is displayed.
  app.post('/api/shopping_lists/:userId/:recipeId', (req, res) => {
    // testing console so linter won't throw errors
    // console.log(req.body);
    axios
      .get(
        `https://api.spoonacular.com/recipes/${req.body.recipeId}/ingredientWidget.json?apiKey=${process.env.apiKey}`
      )
      .then((results) => {
        console.log(results.data);
        results.data.ingredients.forEach((result) => {
          db.ShoppingList.create({
            ingredient: result.name,
            UserId: req.params.userId,
          })
            .then(() => {
              res.status(200).json({ message: 'Items added to shopping list' });
            })
            .catch((err) => {
              res.status(404).json(err);
              console.log('db error', err);
            });
        });
      })
      .catch((err) => {
        console.log('api error', err);
      });
  });
  // route for creating new mealplan for the user upon signup
  app.post('/api/mealplans/:userId', (req, res) => {
    db.Mealplan.create({
      UserId: req.params.userId,
    }).then(() => {
      res.status(200).json({ message: 'user and mealplan created' });
    });
  });
  // Route for getting user's saved recipes
  // user id will be determined by who is logged in
  app.get('/api/recipes/:userId', (req, res) => {
    // testing console so linter won't throw errors
    // console.log(req, res);
    db.Recipe.findAll({
      where: {
        UserId: req.params.userId,
      },
    })
      .then((results) => {
        res.status(200).json(results);
      })
      .catch((err) => {
        console.log(err);
      });
  });
  // route for getting data about saved recipes
  app.get('/api/recipes/searchById/:id', (req, res) => {
    const query = req.params.id;
    axios
      .get(
        `https://api.spoonacular.com/recipes/${query}/information?apiKey=${process.env.apiKey}&includeNutrition=false`
      )
      .then((results) => {
        console.log(results);
        res.json({
          id: query,
          title: results.data.title,
          instructions: results.data.analyzedInstructions[0].steps,
          ingredients: results.data.extendedIngredients,
          image: results.data.image,
          description: results.data.summary,
        });
      })
      .catch((err) => {
        res.status(404).json(err);
        console.log(err);
      });
  });
  // Route for getting the user's current shopping list
  // user id will be determined by who is logged in.
  app.get('/api/shopping_lists/:userId', (req, res) => {
    // testing console so linter won't throw errors
    // console.log(req, res);
    db.ShoppingList.findAll({
      where: {
        UserId: req.params.userId,
      },
    }).then((results) => {
      res.status(200).json(results);
    });
  });
  // route for searching for recipes
  app.get('/api/recipes/search/:searchQuery', (req, res) => {
    const query = req.params.searchQuery;
    // call getRecipes to the food api
    axios
      .get(
        `https://api.spoonacular.com/recipes/complexSearch?apiKey=${process.env.apiKey}&includeIngredients=${query}&addRecipeInformation=true&number=6&instructionsRequired=true`
      )
      .then((results) => {
        // set up an empty array to push the data into
        const recipesArray = [];
        // get recipe data from api call
        const recipes = results.data.results;
        recipes.forEach((recipe) => {
          // push each recipe's id, title, and instructions to the array as an object
          recipesArray.push({
            id: recipe.id,
            title: recipe.title,
            instructions: recipe.analyzedInstructions,
            image: recipe.image,
            description: recipe.summary,
          });
        });
        // send the array to the front end
        res.json(recipesArray);
      })
      .catch((err) => {
        res.json(err);
      });
  });
  // route for getting user's mealplan info
  app.get('/api/mealplan/:userId', (req, res) => {
    db.Mealplan.findOne({
      where: {
        UserId: req.params.userId,
      },
    }).then((results) => {
      // format the response into an array of objects
      res.json([
        { monday: results.monday },
        { tuesday: results.tuesday },
        { wednesday: results.wednesday },
        { thursday: results.thursday },
        { friday: results.friday },
        { saturday: results.saturday },
        { sunday: results.sunday },
      ]);
    });
  });
  // route for deleting entire shopping list for the user
  app.delete('/api/shopping_lists/:userId', (req, res) => {
    db.ShoppingList.destroy({
      where: {
        UserId: req.params.userId,
      },
    })
      .then(() => {
        res.status(200).json({ message: 'it worked' });
      })
      .catch((err) => {
        console.log(err);
      });
  });
  // route for deleting single item from user's list
  app.delete('/api/shopping_lists/:userId/:id', (req, res) => {
    db.ShoppingList.destroy({
      where: {
        UserId: req.params.userId,
        id: req.params.id,
      },
    })
      .then(() => {
        res.status(200).json({ message: 'it worked' });
      })
      .catch((err) => {
        console.log(err);
      });
  });
  // route for deleting recipes the user has saved
  app.delete('/api/recipes/:userId/:recipeId', (req, res) => {
    console.log(req.params.userId, req.params.recipeId);
    db.Recipe.destroy({
      where: {
        UserId: req.params.userId,
        recipeId: req.params.recipeId,
      },
    })
      .then((results) => {
        console.log(results);
        res.json({ msg: 'deleted' });
      })
      .catch((err) => {
        console.log(err);
      });
  });
  // routes for updating the user's meal plan by days
  app.put('/api/mealplan/monday/:recipeId/:userId', (req, res) => {
    db.Mealplan.update(
      { monday: req.params.recipeId },
      {
        where: {
          UserId: req.params.userId,
        },
      }
    ).then((results) => {
      res.json({ message: 'added', results: results });
    });
  });
  app.put('/api/mealplan/tuesday/:recipeId/:userId', (req, res) => {
    db.Mealplan.update(
      { tuesday: req.params.recipeId },
      {
        where: {
          UserId: req.params.userId,
        },
      }
    ).then((results) => {
      res.json({ message: 'added', results: results });
    });
  });
  app.put('/api/mealplan/wednesday/:recipeId/:userId', (req, res) => {
    db.Mealplan.update(
      { wednesday: req.params.recipeId },
      {
        where: {
          UserId: req.params.userId,
        },
      }
    ).then((results) => {
      res.json({ message: 'added', results: results });
    });
  });
  app.put('/api/mealplan/thursday/:recipeId/:userId', (req, res) => {
    db.Mealplan.update(
      { thursday: req.params.recipeId },
      {
        where: {
          UserId: req.params.userId,
        },
      }
    ).then((results) => {
      res.json({ message: 'added', results: results });
    });
  });
  app.put('/api/mealplan/friday/:recipeId/:userId', (req, res) => {
    db.Mealplan.update(
      { friday: req.params.recipeId },
      {
        where: {
          UserId: req.params.userId,
        },
      }
    ).then((results) => {
      res.json({ message: 'added', results: results });
    });
  });
  app.put('/api/mealplan/saturday/:recipeId/:userId', (req, res) => {
    db.Mealplan.update(
      { saturday: req.params.recipeId },
      {
        where: {
          UserId: req.params.userId,
        },
      }
    ).then((results) => {
      res.json({ message: 'added', results: results });
    });
  });
  app.put('/api/mealplan/sunday/:recipeId/:userId', (req, res) => {
    db.Mealplan.update(
      { sunday: req.params.recipeId },
      {
        where: {
          UserId: req.params.userId,
        },
      }
    ).then((results) => {
      res.json({ message: 'added', results: results });
    });
  });
};
