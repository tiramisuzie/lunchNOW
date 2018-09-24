'use strict';

const express = require('express');
const path = require('path');
require('dotenv').config();
const PORT = process.env.PORT;
const app = express();
const tasks = require('./tasks');

// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded());
app.use(express.static('./public'));

app.get('/', tasks.reqDataFromExtAPI);

//grabbing and returning all objects from database
app.get('/recipes', tasks.getData);
//add new object to DB
app.post('/recipes', tasks.addDataToDb);
//details for one object
app.get('/recipes/:id', tasks.getDetails);
//display form
app.get('/new_recipe', tasks.newRecipeForm);

app.get('/search', tasks.searchRecipesForm);
app.get('/search_request/', tasks.searchForRecipesExternalApi);

app.use(tasks.handle404);

// error handler
app.use(tasks.handleError);

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}!`);
});
