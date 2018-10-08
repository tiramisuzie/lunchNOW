'use strict'

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
