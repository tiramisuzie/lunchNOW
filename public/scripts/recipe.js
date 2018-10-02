'use strict';

// I am extremely confused by this reused blog app code.
// None of it is ever used in your app. None of these prototype
// methods need to exist. This scares me greatly: why did someone
// create this file and fill it with nonsense code?
function Recipe(rawDataObj) {
  Object.keys(rawDataObj).forEach(key => {
    this[key] = rawDataObj[key];
  }, this);
}

Recipe.all = [];

Recipe.prototype.toHtml = function() {
  var template = Handlebars.compile($('#recipe-template').text());

  this.daysAgo = parseInt(
    (new Date() - new Date(this.published_on)) / 60 / 60 / 24 / 1000
  );
  // you don't have publish status.
  this.publishStatus = this.published_on
    ? `published ${this.daysAgo} days ago`
    : '(draft)';
  // you don't use markdown.
  this.body = marked(this.body);

  return template(this);
};

Recipe.loadAll = recipeData => {
  recipeData.sort(
    (a, b) => new Date(b.published_on) - new Date(a.published_on)
  );

  recipeData.forEach(recipeObject =>
    // This code will not run. Needs to be Recipe, and recipeObject.
    recipe.all.push(new recipe(articleObject))
  );
};

Recipe.fetchAll = callback => {
  $.get('/recipes').then(results => {
    recipe.loadAll(results);
    callback();
  });
};

Recipe.truncateTable = callback => {
  $.ajax({
    url: '/recipes',
    method: 'DELETE'
  }).then(data => {
    console.log(data);
    if (callback) callback();
  });
};

Recipe.prototype.insertRecord = function(callback) {
  $.post('/recipes', {
    author: this.author,
    author_url: this.author_url,
    body: this.body,
    category: this.category,
    published_on: this.published_on,
    title: this.title
  }).then(data => {
    console.log(data);
    if (callback) callback();
  });
};

Recipe.prototype.deleteRecord = function(callback) {
  $.ajax({
    url: `/recipes/${this.recipe_id}`,
    method: 'DELETE'
  }).then(data => {
    console.log(data);
    if (callback) callback();
  });
};

Recipe.prototype.updateRecord = function(callback) {
  $.ajax({
    url: `/recipes/${this.recipe_id}`,
    method: 'PUT',
    data: {
      author: this.author,
      author_url: this.author_url,
      body: this.body,
      category: this.category,
      published_on: this.published_on,
      title: this.title,
      author_id: this.author_id
    }
  }).then(data => {
    console.log(data);
    if (callback) callback();
  });
};
// literally almost 100 lines of irrelevant code.


// this is nice! this is all the FE JS you needed!
let handleFavorites = function(event) {
  event.preventDefault();
  $.ajax({
    url: `/recipes`,
    method: 'POST',
    data: {
      recipe_id: $(this).data('recipe_id')
    }
  }).then((resp, status, xhr) => {
    let respText = JSON.parse(xhr.responseText);
    if (respText.saved) $(this).addClass('--red');
    else $(this).removeClass('--red');
  });
};

$('.media-obj__button').on('click', handleFavorites);
