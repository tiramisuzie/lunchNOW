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

app.get('/', (req, res) => res.redirect('/recipes'));

// //grabbing and returning all objects from database
app.get('/recipes', tasks.getData);
// //add new object to DB
// app.post('/recipes', tasks.addDataToDb);
// //details for one object
// app.get('/recipes/:id', tasks.getDetails);
// //display form
// app.get('/favorites', tasks.newRecipeForm);

// app.get('/about_us', tasks.searchRecipesForm);
// app.get('/search_results/', tasks.searchForRecipesExternalApi);

app.use(tasks.handle404);

// error handler
app.use(tasks.handleError);

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}!`);
});
