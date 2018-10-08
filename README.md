# lunchNOW

## Authors: 
* [Jeremy Beck](https://github.com/mtncrawler/)
* [Suzanne Su](https://github.com/tiramisuzie/)
* [Alex Stoforandov](https://github.com/al1s/)

**Version**: 2.1.0

## Description
Lunch now is an app which helps organize the cooking process in the most effective way and provide the user with recipes search be ingredients, methods of cooking, nutrition facts and shopping cart functionality.

## USER STORIES
## MVP
As a user, I want to be able to choose the dish to cook based on available ingredients, so I have some proven algorithms to get a lunch (dinner).  
  
As a user, I want to search for recipes based on the ingredients I have available to cook a delicious meal. 

As a user, I want the list of measures for product and instructions in a recipe be available both in imperial and continental scales, so I can share my favorite recipes with my friends from the whole world.  

As a user, I want to view, add, and delete recipes to my recipe book so I can keep track of all the recipes I enjoy or hate.  

As a developer I want to use unlimited power of full-stack application, so I can interact with external APIs, store data on server side in DB, and use templating engines to deliver consistent experience for the user.  

As a hiring manager I want to see fully functional demonstration of abilities of SDE, so I can make decision based of facts. 

## Stretch Goals
As a user, I want the recipes list could be ordered by value of calorie, so I can choose the right dish according my dietary preferences.  

As a user I want to easily get the shopping list out of my recipe, so I can arrange the visit to a grocery store in the most effective way.  

As a developer, I want to register users so that I can add the functionality to pull up recipe books from multiple users.  

## Database Schemas
database - lunchnow  
tables - favoriterecipes, ingredients, ingredientscache, resultscache  
see recipes.sql  

<!-- Missing directions on how to get this up and running on your computer: npm i, adding .env file, creating db/tables -->

## API
Edamam API endpoint - https://developer.edamam.com/edamam-docs-recipe-api  

## Site Endpoints
(/recipes, GET) - loads our index with recipes  
(/recipe_details, GET) - loads recipe details in iframe  
(/favorites, GET) - loads recipes from favorites tables to render favorites page  
(/search/results, GET) - loads results from API on results page  
(/aboutus, GET) - loads the about us page  
(/recipes, POST) - adds recipes to database tables  


## Architecture
EJS, Node, Express, Postgresql, Edamam API

## Change Log

09-28-2018 11:00am - MVP  
09-27-2018 5:30pm - Search bar styled, styling added to all recipe cards  
09-27-2018 11:30am - User can remove then re-add favorite results via favorites to cache tables; search bar added to results and favorites pages  
09-26-2018 5:30pm - Styling added, index page styled, basic styling for ingredients list  
09-26-2018 11:30am - Click to add to favorites, error messaging, iframe for external url link to recipe instructions  
09-25-2018 5:30pm - Nav added and favorite recipes added to favorites tables  
09-25-2018 11:30am - Index and results rendered  
09-24-2018 5:30pm - API call to retrieve recipes to add to cache tables functioning and randomly selected recipes function working  
09-24-2018 11:30am - Database and tables created with new server routes  
09-24-2018 9:30am - Initial Scaffolding  

## Conflict Plan

What will your group do when it encounters conflict?

If we have any conflicts we will communicate it with each other right away to make sure everyone is in agreement

How will you raise concerns to members who are not adequately contributing?

Tasks will be divided amongst us daily. If a member is not adequately contributing we can try to redistribute workflow. Will work with that member to seek the cause and determine what is the best solution together.

What is your process to resolve conflicts?

Open communication and honesty. Constructive feedback.
How and when will you escalate the conflict if your attempts are unsuccessful?

If after 3 unsuccessful attempts, will escalate to Michelle.
Communication Plan

How will you communicate after hours and on the weekend?
Slack chatroom

How will we handle our workload?
Coding will occur during class time, it is not expected for a member to work on any features at home. However, if a member chooses to work on something at home they are welcome to as long as they let the rest of the team know which feature they will be working on. Anything we do we will communicate with each other.

What is your strategy for ensuring everyone's voices are heard?
Listen to everyone's opinion, setting the context and shared goals upfront to the group. Think about different learning/processing styles and bake that into the process design. Ask for everyone's oppinion before moving forward.

How will you ensure that you are creating a safe environment where everyone feels comfortable speaking up?

Being compassionate and understand that mistakes happen, encourage each other to speak-up so that everyone can learn, adapt, and adjust in real-time.
Leave behind the judgement, everyone has different backgrounds and experiences.
