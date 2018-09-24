CREATE TABLE IF NOT EXISTS ingredients(
    ingredient_id SERIAL PRIMARY KEY, 
    ingredient_desc VARCHAR(256), 
    weight INT 
);

CREATE TABLE IF NOT EXISTS favoriteRecipes(
    favoriteRecipe_id SERIAL PRIMARY KEY,
    title VARCHAR(256), 
    image_url VARCHAR(256), 
    directions_url VARCHAR(256), 
    source_title VARCHAR(256), 
    ingredient_id INT REFERENCES ingredients (ingredient_id), 
    calories INT, 
    total_time INT
);

CREATE TABLE IF NOT EXISTS ingredientsCache(
    ingredient_id SERIAL PRIMARY KEY, 
    ingredient_desc VARCHAR(256), 
    weight INT 
);

CREATE TABLE IF NOT EXISTS resultsCache(
    favoriteRecipe_id SERIAL PRIMARY KEY,
    title VARCHAR(256), 
    image_url VARCHAR(256), 
    directions_url VARCHAR(256), 
    source_title VARCHAR(256), 
    ingredient_id INT REFERENCES ingredientsCache (ingredient_id), 
    calories INT, 
    total_time INT
);







