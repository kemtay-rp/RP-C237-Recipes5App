const express = require('express');
const mysql = require('mysql2');
const app = express();
const multer = require('multer');

//Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images'); //Directory to save uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});



// Create MySQL connection
const connection = mysql.createConnection({
host: 'localhost',
user: 'root',
password: '',
database: 'proj_recipes'
});
connection.connect((err) => {
if (err) {
console.error('Error connecting to MySQL:', err);
return;
}
console.log('Connected to MySQL database');
});

// Set up view engine
app.set('view engine', 'ejs');

// enable static files
app.use(express.static('public'));

//enable form processing
app.use(express.urlencoded({
    extended: false
}));

// Define routes
// Example:


app.get('/', (req, res) => {
    const sql = 'SELECT recipes.recipe_id, recipes.title, recipes.description, recipes.image, author.name \
                FROM recipes INNER JOIN author \
                ON recipes.author_id = author.author_id';
    //Fetch data from MySQL
    connection.query( sql, (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error Retrieving products');
        }
        // Render HTML page with data 
        //console.log(results);
        res.render('index', {recipes: results});
    });
});

app.get('/recipe/:id', (req,res) => {
    //Extract the product ID from the request params
    const recipe_id = req.params.id;
    //const sql = 'SELECT * FROM recipes WHERE recipe_id = ?';
    const sql = 'SELECT recipes.recipe_id, recipes.title, recipes.description, recipes.image, author.name \
                FROM recipes INNER JOIN author \
                ON recipes.author_id = author.author_id \
                WHERE recipes.recipe_id = ?';
    //Fetch data from MySQL based on the product ID
    connection.query( sql, [recipe_id], (error,results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error Retrieving product by ID');
        }
        //Check if any product with the given ID was found
        if (results.length > 0) {
            //Render HTML page with data
            res.render('recipe', {recipe: results[0]});   
        } else {
            //If no product with given ID is found, render 404 page or handle it accordingly
            res.status(404).send('Recipe Not Found');
        }
    });
});

const upload = multer ({storage: storage});
app.get('/recipe', (req, res) => {
    const sql = 'SELECT * FROM author';

    connection.query( sql, (error,results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error Retrieving author');
        }
        console.log(results);
        res.render('addRecipe', {authors: results});
    });
});

app.post('/recipe', upload.single('image'), (req,res) => {
    //Extract product data from the request body
    const { title, desc, author } = req.body;
    let image;
    if (req.file) {
        image = req.file.filename; //Save only the filename
    } else {
        image = null;
    }

    const sql = 'INSERT INTO recipes (title, description, author_id, image) VALUES (?,?,?,?)';
    //Insert new product into database
    connection.query( sql, [title, desc, author, image], (error, results) => {
        if (error) {
            //Handle any error
            console.error("Error Adding Product:",error);
            res.status(500).send('Error Adding Product');
        } else {
            //Send successful response
            res.redirect('/');
        }
    });
});

app.get('/editRecipe/:id', (req,res) => {
    const recipe_id = req.params.id;
    const sql_recipes = 'SELECT * FROM recipes WHERE recipe_id = ?';
    const sql_author = 'SELECT * FROM author';
    //Fetch data from mySQL based on the product ID
    connection.query( sql_recipes, [recipe_id], (error, results) => {
        if (error) {
            console.error("Datebase query error:",error.message);
            return res.status(500).send('Error retrieving product by ID');
        }
        //Check if any of the product with the given ID was found
        if (results.length > 0) {
            connection.query( sql_author, (error, authors) => {
                if (error) {
                    console.error("Datebase query error:",error.message);
                    return res.status(500).send('Error retrieving authors');
                }
                //console.log(authors);
                //Render HTML page with the product data
                res.render('editRecipe', {recipe: results[0], authors});
            });
            
        } else {
            //If no product with the given ID was found, render a 404 page or handle it accordingly
            res.status(404).send('Recipe not found');
        }
    });
});

app.post('/editRecipe/:id', upload.single('image'), (req,res) => {
    const recipe_id = req.params.id;
    //Extract product data from the request body
    const {title, desc, author} = req.body;

    let image = req.body.currentImage; //Retrieve current image filename
    if (req.file) { //if new image is uploaded
        image = req.file.filename; //set image to be new image filename
    } 
    //console.log(image);
    
    const sql = 'UPDATE recipes SET title = ?, description = ?, author_id = ?, image = ? WHERE recipe_id = ?';

    //Insert new product into database
    connection.query(sql, [title, desc, author, image, recipe_id], (error, results) => {
        if (error) {
            //Handle any error that occurs during the database operation
            console.error("Error updating recipe:",error);
            res.status(500).send('Error updating recipe');
        } else {
            //Send a successful response
            res.redirect('/');
        }
    });
});

app.get('/deleteRecipe/:id', (req,res) => {
    const recipe_id = req.params.id;
    const sql = 'DELETE FROM recipes WHERE recipe_id = ?';
    connection.query( sql, [recipe_id], (error,results) => {
        if (error) {
            //Handle any error that occurs during the database operation
            console.error("Error deleting recipe:", error);
            res.status(500).send("Error deleting recipe");
        } else {
            //Send successful response
            res.redirect('/');
        }
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port http://localhost:${PORT}`));