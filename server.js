'use strict';

/*
* The app implements 6 endpoints which allows
* it on the behalf of front-end to request
* data from external API; to store/retrieve/delete
* that data to/from local DB.
* Data lifecycle consists of following:
*   - get data from external API (retrieve part of the first stage;
*     either by user search or randomly through the main page);
*   - store data to temporary tables (store part first stage);
*   - move data to persistent tables from temp tables (second stage;
*     the user saves data she wants later to retrieve);
*   - retrieve data from persistent tables (third stage; present the data
*     to the user );
*   - move data to temp tables from persistent ones (fourth stage; the user
*     wants to get rid of the data, but still can change her mind and
*     'resave' the data in DB);
*   - clear data from temp tables (fifth stage; the user cannot 'resave');
*/

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

// pull random data from external API for the main page
// and save them to temp tables in DB (cache-like tables)
app.get('/', tasks.getRandomRecipes);

// (this part isn't RESTful: one endpoint, two actions)
// add new data to DB (persistent tables)
// or delete data from DB
app.post('/recipes', tasks.handleDataManipulationRequest);

// show external URL in an iframe
app.get('/recipe-details', (req, res) =>
  res.render('./pages/recipes/iframe', {
    url: req.query.url,
    id: req.query.id,
    saved: req.query.saved === 'true' ? true : false
  })
);

// show records saved to DB
app.get('/favorites', tasks.renderFavoriteRecipes);

// show search results
// and copy them to temp tables (cache-like)
app.get('/search/results', tasks.searchForRecipesExternalApi);

// show About Us page
app.get('/aboutus', (req, res) => res.render('./pages/aboutus'));

// Under construction dummy page
app.get('/shoppinglist', (req, res) => res.render('./pages/shoppinglist'));

app.use(tasks.handle404);

// error handler
app.use(tasks.handleError);

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}!`);
});
