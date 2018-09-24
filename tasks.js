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
//display form
function searchForRecipesExternalApi() {}

module.exports = {
  handleError,
  handleConnectionError,
  handle404,
  getData,
  addDataToDb,
  getDetails,
  searchForRecipesExternalApi
};
