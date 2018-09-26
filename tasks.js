const pg = require('pg');
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

function dbCacheInsert(apiResponse) {
  wipeTables();
  let recipes = apiResponse.body.hits.map(recipe => {
    return {
      id: recipe.recipe.uri.slice(-32),
      title: recipe.recipe.label,
      image_url: recipe.recipe.image,
      directions_url: recipe.recipe.url,
      source_title: recipe.recipe.source,
      calories: Math.round(recipe.recipe.calories),
      total_time: recipe.recipe.totalTime,
      ingredients: recipe.recipe.ingredientLines
    };
  });

  recipes.forEach((recipe, index) => {
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
    console.log('cache table inserted');
    client.query(SQL, values).then(data => {
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
  let howMuchToShow = 3;
  let howMuchIngredients = 2;
  let randomIngredients = getRandomFromRange(
    ingredientList.ingredients,
    howMuchIngredients
  );
  let queryStringForApi = randomIngredients.join(' ').replace(/\s/g, '+');
  let url = `https://api.edamam.com/search?q=${queryStringForApi}&app_id=${
    process.env.ApplicationID
  }&app_key=${process.env.ApplicationKey}&to=${howMuchToShow}`;
  console.log(url);
  console.log(randomIngredients);
  superagent.get(url).end((err, apiResponse) => {
    let recipesToRender = dbCacheInsert(apiResponse);
    res.render('index', { recipes: recipesToRender });
  });
}

function checkRecordExistsInDB(req, res) {
  let SQL = 'select 1 from favoriteRecipes where favoriterecipe_id = $1);';
  let recipe_id = req.body.recipe_id;
  let values = [recipe_id];
  client
    .query(SQL, values)
    .then(data =>
      res.send(JSON.stringify({ saved: data.rowCount, id: recipe_id }))
    );
}

//add new object to DB
function addDataToDb(req, res) {
  console.log('post');
  let recipe_id = req.body.recipe_id;
  let msgForTrx = `Recipe_id #...${recipe_id.slice(-10)}: `;
  console.log(`${msgForTrx}begin`);

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
    let SQL = `INSERT INTO ingredients (recipe_ref_id, ingredient_desc) 
      SELECT recipe_ref_id, ingredient_desc 
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

//truncate cache tables
function wipeTables() {
  let SQL = 'TRUNCATE ingredientscache, resultscache;';
  client.query(SQL).then(() => {
    console.log('cache tables truncated');
  });
}

//details for one object
function getDetails() {}

//display API results from queried items
function searchForRecipesExternalApi(request, response) {
  console.log(request.query.searchBar);

  superagent
    .get(
      `https://api.edamam.com/search?q=${request.query.searchBar}&app_id=${
        process.env.ApplicationID
      }&app_key=${process.env.ApplicationKey}`
    )
    .end((err, apiResponse, next) => {
      if(err) {
        next(createError(err));
      } else {
        let recipesToRender = dbCacheInsert(apiResponse);
        response.render('./pages/searches/results', { recipes: recipesToRender, returnedFromApi:true });
      }

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
