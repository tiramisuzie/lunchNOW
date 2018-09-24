const pg = require('pg');
const validator = require('validator');
const superagent = require('superagent');
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

function getData(req, res, next) {
  res.render('index');

}
//add new object to DB
function addDataToDb() {}
//details for one object
function getDetails() {}

//display API results from queried items
function searchForRecipesExternalApi(request, response) {
  console.log(request.query.searchBar);
  superagent.get(`https://api.edamam.com/search?q=${request.query.searchBar}`)
    .end( (err, apiResponse) => {
      console.log(apiResponse.body);

      let recipes = apiResponse.body.items.map(recipe => ({
        title:          recipe.hits.recipe.label,
        image_url:      recipe.hits.recipe.image,
        directions_url: recipe.hits.recipe.url,
        source_title:   recipe.hits.recipe.source,
        calories:       recipe.hits.recipe.calories,
        total_time:     recipe.hits.recipe.totalTime
      }));

      let ingredients = apiResponse.body.items.map( recipe => {
        recipe.hits.recipe.ingredients.map( ing => ing.text)
      });

      recipes.forEach( (recipe, ndx) => {
        let SQL = 'INSERT INTO resultsCache(title, image_url, directions_url, source_title, calories, total_time) VALUES($1, $2, $3, $4, $5, $6) RETURNING resultsRecipe_id;'
        let values = [
          apiResponse.body.items.hits.recipe.label,
          apiResponse.body.items.hits.recipe.image,
          apiResponse.body.items.hits.recipe.url,
          apiResponse.body.items.hits.recipe.source,
          apiResponse.body.items.hits.recipe.calories,
          apiResponse.body.items.hits.recipe.totalTime
        ];
        client.query(SQL,values).then(data => {
          ingredients[ndx].forEach(ing => {
            let SQL = 'INSERT INTO ingredientsCache(recipe_ref_id, ingredient_desc) VALUES($1, $2);'
            let values = [data.rows[0].resultsRecipe_id, ing.text];
            client.query(SQL, values);
          })
        })
      })
      response.render('./pages/searches/results', {recipes: recipes});
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
