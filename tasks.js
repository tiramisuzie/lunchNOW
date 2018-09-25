const pg = require('pg');
// const validator = require('validator');
const superagent = require('superagent');
const ingredients = require('./ingredients');
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

function getData(req, res, next) {
  superagent
    .get(
      `https://api.edamam.com/search?q=${getRandomFromRange(
        ingredients
      )}&app_key=${process.env.ApplicationKey}&app_id=${
        process.env.ApplicationID
      }&to=3`
    )
    .end((err, apiResponse) => {
      console.log(apiResponse.body);
    });
  res.render('index');
}

//add new object to DB
function addDataToDb() {}
//details for one object
function getDetails() {}

//display API results from queried items
function searchForRecipesExternalApi(request, response) {
  console.log(request.query.searchBar);

  superagent.get(`https://api.edamam.com/search?q=${request.query.searchBar}&app_id=${process.env.ApplicationID}&app_key=${process.env.ApplicationKey}`)
    .end( (err, apiResponse) => {


      let recipes = apiResponse.body.hits.map(recipe => {
        // console.log(recipe);
        return {
          title:         recipe.recipe.label,
          image_url:     recipe.recipe.image,
          directions_url:recipe.recipe.url,
          source_title:  recipe.recipe.source,
          calories:      Math.round(recipe.recipe.calories),
          total_time:    recipe.recipe.totalTime,
          ingredients:   recipe.recipe.ingredientLines
        }});


      // let ingredients = apiResponse.body.hits.map( recipe => {
      //   console.log(recipe);
      //   return recipe.ingredients.map( ing => ing.text)
      // });

      recipes.forEach( (recipe) => {
        let SQL = 'INSERT INTO resultsCache(title, image_url, directions_url, source_title, calories, total_time) VALUES($1, $2, $3, $4, $5, $6) RETURNING resultsRecipe_id;'
        let values = [
          recipe.title,
          recipe.image_url,
          recipe.directions_url,
          recipe.source_title,
          recipe.calories,
          recipe.total_time
        ];

        client.query(SQL,values).then(data => {
          console.log(data.rows[0]);
          recipe.ingredients.forEach(ing => {
            let SQL = 'INSERT INTO ingredientsCache(recipe_ref_id, ingredient_desc) VALUES($1, $2);'
            let values = [data.rows[0].resultsrecipe_id, ing];
            client.query(SQL, values);
          });
        });
      });
      response.render('./pages/searches/results', { recipes: recipes });
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
