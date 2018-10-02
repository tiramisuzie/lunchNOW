'use strict';

const express = require('express');
const path = require('path');
require('dotenv').config();
const PORT = process.env.PORT;
const app = express();
const tasks = require('./tasks');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded());
app.use(express.static('./public'));

// zombie code! noooo! make sure you remove this!
// app.get('/', (req, res) => res.redirect('/recipes'));

//grabbing and returning all objects from database
app.get('/', tasks.getData);
// app.get('/recipes', tasks.getData);

//add new object to DB
app.post('/recipes', tasks.handleDataManipulationRequest);

// why is this one not in the external spot?
//details for one object
app.get('/recipe-details', (req, res) =>
  res.render('./pages/recipes/iframe', {
    url: req.query.url,
    id: req.query.id,
    // the ternary isn't necessary here!
    saved: req.query.saved === 'true'
  })
);
//display form

app.get('/favorites', tasks.renderFavoriteRecipes);
//TO DO: need to replace task.getData with function that will populate the favorites from the sql table to the page.

// app.get('/about_us', tasks.searchRecipesForm);
app.get('/search/results', tasks.searchForRecipesExternalApi);

app.get('/aboutus', (req, res) => res.render('./pages/aboutus'));
app.get('/shoppinglist', (req, res) => res.render('./pages/shoppinglist'));

app.use(tasks.handle404);

// error handler
app.use(tasks.handleError);

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}!`);
});
