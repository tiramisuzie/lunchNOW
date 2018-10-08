-- Create tables for our ingredients and favorite recipes, plus the cache tables to save our results
CREATE TABLE IF NOT EXISTS favoriterecipes(
    favoriterecipe_id VARCHAR(32) PRIMARY KEY,
    title VARCHAR(256), 
    image_url VARCHAR(256), 
    directions_url VARCHAR(256), 
    source_title VARCHAR(256), 
    calories INT, 
    total_time INT
);

-- no primary keys on ingredients?
CREATE TABLE IF NOT EXISTS ingredients(
    recipe_ref_id VARCHAR(32) REFERENCES favoriterecipes (favoriterecipe_id),
    ingredient_desc VARCHAR(256),
    weight INT
);

CREATE TABLE IF NOT EXISTS resultscache(
    resultsrecipe_id VARCHAR(32) PRIMARY KEY,
    title VARCHAR(256),
    image_url VARCHAR(256),
    directions_url VARCHAR(256),
    source_title VARCHAR(256),
    calories INT,
    total_time INT
);

CREATE TABLE IF NOT EXISTS ingredientscache(
    recipe_ref_id VARCHAR(32) REFERENCES resultscache (resultsrecipe_id), 
    ingredient_desc VARCHAR(256), 
    weight INT 
);
