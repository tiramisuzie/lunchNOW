const pg = require('pg');
const validator = require('validator');
const superagent = require('superagent');
const ingredientList = require('./ingredients.json');
require('dotenv').config();
var createError = require('http-errors');
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', handleConnectionError);

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

function getRandomFromRange(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function dbCacheInsert(apiResponse) {
  wipeTables();
  let recipes = apiResponse.body.hits.map(recipe => {
    return {
      id:            recipe.recipe.uri.slice(-32),
      title:         recipe.recipe.label,
      image_url:     recipe.recipe.image,
      directions_url:recipe.recipe.url,
      source_title:  recipe.recipe.source,
      calories:      Math.round(recipe.recipe.calories),
      total_time:    recipe.recipe.totalTime,
      ingredients:   recipe.recipe.ingredientLines
    }});

  recipes.forEach( (recipe, index) => {
    let SQL = 'INSERT INTO resultsCache(title, image_url, directions_url, source_title, calories, total_time, resultsRecipe_id) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING resultsRecipe_id;'

    let values = [
      recipe.title,
      recipe.image_url,
      recipe.directions_url,
      recipe.source_title,
      recipe.calories,
      recipe.total_time,
      recipe.id
    ];

    client.query(SQL, values).then(data => {
      console.log(data.rows[0].resultsrecipe_id);
      recipe.ingredients.forEach(ing => {
        let SQL =
          'INSERT INTO ingredientsCache(recipe_ref_id, ingredient_desc) VALUES($1, $2);';
        let values = [data.rows[0].resultsrecipe_id, ing];
        client.query(SQL, values);
      });
    });
  });
  return recipes;
}

function getData(req, res, next) {
  let randomIngredient = getRandomFromRange(ingredientList.ingredients).replace(
    /\s/g,
    '+'
  );
  let howMuchToShow = 9;
  let url = `https://api.edamam.com/search?q=${randomIngredient}&app_id=${
    process.env.ApplicationID
  }&app_key=${process.env.ApplicationKey}&to=${howMuchToShow}`;
  console.log(url);
  superagent.get(url).end((err, apiResponse) => {
    let recipesToRender = dbCacheInsert(apiResponse);
    res.render('index', { recipes: recipesToRender });
  })
}

//add new object to DB
function addDataToDb(req, res) {
  console.log('post');
  console.log(req.body);

  let SQL = `INSERT INTO favoriteRecipes (favoriteRecipe_id, title, image_url, directions_url, source_title, calories, total_time) 
  SELECT resultsRecipe_id, title, image_url, directions_url, source_title, calories, total_time 
  FROM resultsCache 
  WHERE resultsRecipe_id = '${req.body.recipe_id}';`;

  client.query(SQL).then(data => {
    console.log('First passed');
    let SQL = `INSERT INTO ingredients (recipe_ref_id, ingredient_desc) SELECT recipe_ref_id, ingredient_desc FROM ingredientsCache WHERE recipe_ref_id = '${req.body.recipe_id}';`;


    // client.query(SQL).then(_ => res.body.saved = true);

  })
}

//truncate tables
function wipeTables() {
  let SQL = 'TRUNCATE ingredientscache, resultscache;'
  client.query(SQL).then( () => {
    console.log('cache tables truncated');
  })
}

//details for one object
function getDetails() {}

//display API results from queried items
function searchForRecipesExternalApi(request, response) {
  console.log(request.query.searchBar);

  superagent.get(`https://api.edamam.com/search?q=${request.query.searchBar}&app_id=${process.env.ApplicationID}&app_key=${process.env.ApplicationKey}`)
    .end( (err, apiResponse) => {
      let recipesToRender = dbCacheInsert(apiResponse);
      response.render('./pages/searches/results', { recipes: recipesToRender });
    });
}

module.exports = {
  handleError,
  handleConnectionError,
  handle404,
  getData,
  addDataToDb,
  getDetails,
  searchForRecipesExternalApi
};
