// why is this called 'tasks', that was only relevant when I wrote a tasks app
const pg = require('pg');
const validatorEscape = require('validator/lib/escape');
const superagent = require('superagent');
const ingredientList = require('./ingredients.json');
require('dotenv').config();
var createError = require('http-errors');
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', handleConnectionError);

// Overall feedback: parsing through this file is _hard_.
// I need a lot more context on these functions, with comments or something,
// because right now I have no idea what these functions are for.
// It also says "helper functions" at the top, but I have no idea (without deeper diving)
// which of the functions in this file are actually used at a route, vs. are just called
// within this file.
//helper functions
function handleError(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('pages/error', { code: err.status, message: err.message });
}

function handleConnectionError(error) {
  console.error(error);
  createError(error.status, 'DB Connection Error');
}

function handle404(req, res, next) {
  next(createError(404));
}

function getRandomFromArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomFromRange(arr, numberElmToChoose) {
  let result = [];
  let randomProduct;
  for (let i = 0; i < numberElmToChoose; i++) {
    do {
      randomProduct = getRandomFromArray(arr);
    } while (result.includes(randomProduct));
    result.push(randomProduct);
  }
  return result;
}

//insert search results and random index recipes to cache tables
function dbCacheInsert(recipeObj) {
  recipeObj.forEach(recipe => {
    let SQL =
      'INSERT INTO resultsCache(title, image_url, directions_url, source_title, calories, total_time, resultsRecipe_id) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING resultsRecipe_id;';

    let values = [
      recipe.title,
      recipe.image_url,
      recipe.directions_url,
      recipe.source_title,
      recipe.calories,
      recipe.total_time,
      recipe.id
    ];
    // console.log('cache table inserted');
    client
      .query(SQL, values)
      .then(data => {
        recipe.ingredients.forEach(ing => {
          let SQL =
            'INSERT INTO ingredientsCache(recipe_ref_id, ingredient_desc, weight) VALUES($1, $2, $3);';
          let values = [
            data.rows[0].resultsrecipe_id,
            ing.text,
            Math.ceil(ing.weight)
          ];
          client.query(SQL, values);
        });
      })
      .catch(err => createError(err));
  });
  // You're doing this Promise.all on the secondary check, instead of on the initial insert! I'd rather do both of the above inserts within a Promise.all.
  return Promise.all(
    recipeObj.map(recipe => checkRecordExistsInDB(recipe.id))
  ).then(data => {
    data.forEach(
      (elmExists, ndx) => (recipeObj[ndx].saved = Boolean(elmExists))
    );
    return recipeObj;
  });
}

//take API response and turn into recipe object
function toRecipeObj(apiResponse) {
  // Seems unnecessarily verbose... you could just say:
  // if (!apiResponse.body.hits) return [];
  if (Object.keys(apiResponse.body).length === 0) return [];
  return apiResponse.body.hits.map(recipe => {
    return {
      id: recipe.recipe.uri.slice(-32),
      title: recipe.recipe.label,
      image_url: recipe.recipe.image,
      directions_url: recipe.recipe.url,
      source_title: recipe.recipe.source,
      calories: Math.round(recipe.recipe.calories),
      total_time: recipe.recipe.totalTime,
      ingredients: recipe.recipe.ingredients,
      saved: false
    };
  });
}

//randomly use ingredients from array to generate recipes to display on index
function getData(req, res, next) {
  let howMuchToShow = 6;
  let howMuchIngredients = 2;
  let randomIngredients = getRandomFromRange(
    ingredientList.ingredients,
    howMuchIngredients
  );
  // Shouldn't be necessary-it should fix that automatically when you use superagent.
  // In fact, you should be able to use .query: see https://visionmedia.github.io/superagent/#get-requests
  let queryStringForApi = randomIngredients.join(' ').replace(/\s/g, '+');
  let url = `https://api.edamam.com/search?q=${queryStringForApi}&app_id=${
    process.env.ApplicationID
  }&app_key=${process.env.ApplicationKey}&to=${howMuchToShow}`;
  console.log(`randomIngredients: ${randomIngredients}`);
  superagent.get(url).end((err, apiResponse) => {
    wipeTables();
    let recipesData = toRecipeObj(apiResponse);
    dbCacheInsert(recipesData).then(recipes => res.render('index', { recipes }));
  });
}

// I don't like that this uses a plural parameter name for a single value.
// I'd MUCH rather call this id or value.
function checkRecordExistsInDB(values) {
  let SQL = 'select 1 from favoriteRecipes where favoriterecipe_id = $1;';
  return client.query(SQL, [values]).then(data => data.rowCount);
}

//query ingredients for favorite recipes to render favorites page with ingredients
// Seems like this is only used in one place?
function retrieveIngredientsForFavoriteRecipe(values) {
  let SQL =
    'SELECT ingredient_desc as text FROM ingredients WHERE recipe_ref_id = $1;';
  return client.query(SQL, [values]).then(result => {
    // console.log(result);
    return result;
  });
}

//add new object to DB
function addDataToDb(req, res) {
  // console.log('post');
  let recipe_id = req.body.recipe_id;
  let msgForTrx = `Recipe_id #...${recipe_id.slice(-10)}: `;
  console.log(`${msgForTrx}begin insertion`);

  let SQL = `INSERT INTO favoriteRecipes (
      favoriteRecipe_id, 
      title, 
      image_url, 
      directions_url, 
      source_title, 
      calories, 
      total_time) 
  SELECT 
    resultsRecipe_id, 
    title, 
    image_url, 
    directions_url, 
    source_title, 
    calories, 
    total_time 
  FROM resultsCache 
 WHERE resultsRecipe_id = $1
   and not exists (
    select 1 
      from favoriteRecipes 
     where favoriterecipe_id = $1);`;
  let values = [recipe_id];

  client.query(SQL, values).then(data => {
    console.log(`${msgForTrx}inserted into favoriteRecipes ${data.rowCount}`);
    let SQL = `INSERT INTO ingredients (recipe_ref_id, ingredient_desc, weight) 
      SELECT recipe_ref_id, ingredient_desc , weight
        FROM ingredientsCache 
       WHERE recipe_ref_id = $1
         and not exists (
          select 1 
            from ingredients 
           where recipe_ref_id = $1);`;

    client.query(SQL, values).then(data => {
      console.log(`${msgForTrx}inserted into ingredients ${data.rowCount}`);
      res.send(JSON.stringify({ saved: true, id: recipe_id }));
      console.log(`${msgForTrx}end`);
    });
  });
}

//render favorite recipes page from favorites table
function renderFavoriteRecipes(request, response, next) {
  let SQL = `SELECT favoriteRecipe_id as id, 
  title, 
  image_url, 
  directions_url, 
  source_title, 
  calories, 
  total_time , true as saved FROM favoriterecipes;`;

  client.query(SQL, (err, result) => {
    if (err) {
      console.error(err);
      // noooo zombie
      // response.redirect('/error');
      next(createError(err));
    } else {
      Promise.all(
        result.rows.map(recipe => {
          return retrieveIngredientsForFavoriteRecipe(recipe.id);
        })
      )
        .then(data => {
          // console.log(data.rows);
          data.forEach(
            (ingredients, ndx) =>
              (result.rows[ndx].ingredients = ingredients.rows)
          );
          // console.log(result.rows);
          response.render(`./pages/recipes/favorites`, {
            recipes: result.rows
          });
        })
        .catch(err => next(createError(err)));
    }
  });
}

//truncate cache tables
function wipeTables() {
  let SQL = 'TRUNCATE ingredientscache, resultscache;';
  client.query(SQL).then(() => {
    console.log('cache tables truncated');
  });
}

//details for one recipe to display in iframe page
// function getDetails(request, response) {
//   response.render('.pages/recipes/iframe', )
// }

//display API results from queried items
function searchForRecipesExternalApi(request, response, next) {
  let userInputSanitized = validatorEscape(request.query.searchBar);
  console.log(`User input was: ${userInputSanitized}`);
  // could also use .query here instead of constructing by hand
  let url = `https://api.edamam.com/search?q=${userInputSanitized}&app_id=${
    process.env.ApplicationID
  }&app_key=${process.env.ApplicationKey}`;
  console.log(`Url to external API: ${url}`);
  superagent.get(url).end((err, apiResponse) => {
    if (err) {
      next(createError(err));
    } else {
      wipeTables();
      let recipesData = toRecipeObj(apiResponse);
      dbCacheInsert(recipesData).then(recipes =>
        response.render('./pages/searches/results', {
          recipes: recipes
        })
      );
    }
  });
}

// why is there an assortment of req/res vs. request/response? consistency!
function handleDataManipulationRequest(req, res, next) {
  let recipe_id = req.body.recipe_id;
  checkRecordExistsInDB(recipe_id)
    .then(data => {
      if (data) transferToCache(req, res, next);
      else addDataToDb(req, res, next);
    })
    .catch(err => next(createError(err)));
}

function transferToCache(req, res, next) {
  copyToCache(req, res, next).then(() => deleteDataFromDb(req, res, next));
}

//copy favorites and ingredients into cache tables to allow user to re-favorite a recipe
function copyToCache(req, res, next) {
  // why did you define this to take in req/res/next when it only needs req?
  let recipe_id = req.body.recipe_id;
  let msgForTrx = `Recipe_id #...${recipe_id.slice(-10)}: `;
  console.log(`${msgForTrx}begin insertion`);

  let SQL = `INSERT INTO resultsCache (
    resultsRecipe_id, 
    title, 
    image_url, 
    directions_url, 
    source_title, 
    calories, 
    total_time 
    ) 
  SELECT 
    favoriteRecipe_id, 
    title, 
    image_url, 
    directions_url, 
    source_title, 
    calories, 
    total_time
  FROM favoriteRecipes
  WHERE favoriterecipe_id = $1
   and not exists (
    select 1 
      from resultscache 
     where resultsrecipe_id = $1);`;
  // line 315, it flips to lower case; why?
  let values = [recipe_id];

  // returning promises inside of returning promises makes me nervous.
  // this feels over-engineered.
  return client.query(SQL, values).then(data => {
    console.log(`${msgForTrx}inserted into resultscache ${data.rowCount}`);
    let SQL = `INSERT INTO ingredientscache (recipe_ref_id, ingredient_desc) 
      SELECT recipe_ref_id, ingredient_desc 
        FROM ingredients 
       WHERE recipe_ref_id = $1
         and not exists (
          select 1 
            from ingredientscache 
           where recipe_ref_id = $1);`;
    return client.query(SQL, values).then(data => {
      console.log(
        `${msgForTrx}inserted into ingredientscache ${data.rowCount}`
      );
      console.log(`${msgForTrx}end`);
    });
  });
}

//delete from ingredients and favorites tables
function deleteDataFromDb(req, res, next) {
  let recipe_id = req.body.recipe_id;
  let msgForTrx = `Recipe_id #...${recipe_id.slice(-10)}: `;
  console.log(`${msgForTrx}begin deletion`);

  let SQL = `delete from ingredients where recipe_ref_id = $1;`;
  let values = [recipe_id];
  client
    .query(SQL, values)
    .then(data => {
      console.log(`${msgForTrx}deleted from ingredients ${data.rowCount}`);
      let SQL = `delete from favoriteRecipes where favoriterecipe_id = $1;`;
      client.query(SQL, values).then(data => {
        console.log(
          `${msgForTrx}deleted from favoriteRecipes ${data.rowCount}`
        );
        res.send(JSON.stringify({ saved: false, id: recipe_id }));
        console.log(`${msgForTrx}end`);
      });
    })
    .catch(err => next(createError(err)));
}

module.exports = {
  handleError,
  handleConnectionError,
  handle404,
  getData,
  // You don't actually use this in any other file; why is it exported?
  // Ditto with many of the other helper methods.
  addDataToDb,
  searchForRecipesExternalApi,
  handleDataManipulationRequest,
  deleteDataFromDb,
  renderFavoriteRecipes,
  copyToCache
};
