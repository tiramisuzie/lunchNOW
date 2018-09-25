-- Create tables for our ingredients and favorite recipes, plus the cache tables to save our results
CREATE TABLE IF NOT EXISTS favoriteRecipes(
    favoriteRecipe_id SERIAL PRIMARY KEY,
    title VARCHAR(256), 
    image_url VARCHAR(256), 
    directions_url VARCHAR(256), 
    source_title VARCHAR(256), 
    calories INT, 
    total_time INT
);

CREATE TABLE IF NOT EXISTS ingredients(
    recipe_ref_id INT REFERENCES favoriteRecipes (favoriteRecipe_id), 
    ingredient_desc VARCHAR(256), 
    weight INT 
);

CREATE TABLE IF NOT EXISTS resultsCache(
    resultsRecipe_id SERIAL PRIMARY KEY,
    title VARCHAR(256), 
    image_url VARCHAR(256), 
    directions_url VARCHAR(256), 
    source_title VARCHAR(256), 
    calories INT, 
    total_time INT
);

CREATE TABLE IF NOT EXISTS ingredientsCache(
    recipe_ref_id INT REFERENCES resultsCache (resultsRecipe_id), 
    ingredient_desc VARCHAR(256), 
    weight INT 
);








