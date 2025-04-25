import express from 'express';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import session from 'express-session';

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());

//initializing sessions
app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}))

//for Express to get values using POST method
app.use(express.urlencoded({extended:true}));

//Just using this info as a placeholder
//We can change it when we set up a new db
//-A replaced with my db since I am going to be acting as DBA
const pool = mysql.createPool({
    host: "leewaycode.online",
    user: "leewayco_webuser",
    password: "CSOnline2025",
    database: "leewayco_KitchInventory",
    connectionLimit: 10,
    waitForConnections: true
});
const conn = await pool.getConnection();

//routes
app.get('/', isAuthenticated, async(req, res) => {
   res.render('index', 
    {users: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]})
});

app.get('/login', (req, res) => {
    res.render('login')
});

app.post('/login', async (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    let passHash = "";



    let sql = `SELECT * 
    FROM admin   
    WHERE username = ?`;
    const [rows] = await conn.query(sql, [username]);
    if (rows.length > 0) {
        passHash = rows[0].password;
    }

    let match = await bcrypt.compare(password, passHash)

    if (match) {
        req.session.userID = rows[0].userID;
        req.session.authenticated = true;
        res.redirect('/');
    } else {
        res.redirect("/login");
    }
});

app.get('/register', (req, res) => {
    res.render('register')
});

app.post('/register', async (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    let passwordConfirm = req.body.passwordConfirm;
    if(password == passwordConfirm){
        let passHash = await bcrypt.hash(password,10);
    
    
        let sql = `INSERT INTO admin
        (username, password)
        VALUES (?,?)`;
    
        const [rows] = await conn.query(sql, [username,passHash]);
        res.redirect("/login")

    } else {
        res.redirect("/register")
    }
    
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login')
});

app.get('/ingredients', isAuthenticated, async (req, res) => {
    let sql = `SELECT * FROM ingredients
    WHERE userId = ?
    ORDER BY name`;
    const [rows] = await conn.query(sql, [req.session.userID]);
    console.log(rows);
    res.render('ingredients', 
     {ingredients: rows})
 });

app.get('/ingredients/add', async(req, res) => {
    res.render('addIngredient')
 });

app.post('/ingredients/add', async (req, res) => {
  const { name, quantity, unit } = req.body;
  if (!name || !quantity || !unit) {
    return res.status(400).send('All fields are required.');
  }
  let sql = `INSERT into ingredients
  (name, qty, unit, userID) 
  VALUES (?,?,?,?)`;
  let params = [name, quantity, unit, req.session.userID];
  const [rows] = await conn.query(sql, params);
  console.log({ name, quantity, unit });
  // Redirect back to main index or inventory view
  res.redirect('/ingredients');
});

app.get("/ingredients/edit", async function(req, res){
    let ingredientId = req.query.ingredientId;
    let sql = `SELECT *
    FROM ingredients
    WHERE ingredientId = ?`;
    const [rows] = await conn.query(sql, [ingredientId]);
    res.render("editIngredient", {ingredientInfo: [{ ingredientId: rows[0].ingredientId, name: rows[0].name, quantity: rows[0].qty, unit: rows[0].unit }]});
   });

app.post("/ingredients/edit", async function(req, res){
  const {ingredientId, name, quantity, unit } = req.body;
  let sql = `UPDATE ingredients
  SET name = ?,
  qty = ?,
  unit = ?
  WHERE ingredientId = ?`;
  let params = [name, quantity, unit, ingredientId];
  const [rows] = await conn.query(sql, params);
  res.redirect("/ingredients");
});

app.get("/ingredients/delete", async function(req, res){
    let ingredientId = req.query.ingredientId;
    let sql = `DELETE FROM ingredients
    WHERE ingredientId = ?`;
    const [rows] = await conn.query(sql, [ingredientId]);
    res.redirect("/ingredients");
});
 
app.get('/user/add', async(req, res) => {
    
    res.render('addUser')
 });

app.post('/user/add', (req, res) => {
  const name = req.body;

  console.log(name);

  res.redirect('/');
});

app.get('/recipes', isAuthenticated, async (req, res) => {
    const userID = req.session.userID; 
    const sql = `SELECT * FROM ingredients WHERE userID = ? ORDER BY name`;
    const [rows] = await conn.query(sql, [userID]);
    res.render('recipes', {"ingredients":rows}); 
});


app.get('/recipes/search', isAuthenticated, async (req, res) => {
    const ingredient = req.query.ingredient;

    try {
        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${ingredient}`);
        const data = await response.json();
        const recipes = data.meals || []; // empty if no recipes found

        res.json({ recipes }); // Return JSON data
    } catch (error) {
        console.error('Error fetching recipes:', error);
        res.status(500).json({ error: 'Error fetching recipes' });
    }
});

app.get('/recipes/:id', isAuthenticated, async (req, res) => {
    const recipeId = req.params.id;

    try {
        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${recipeId}`);
        const data = await response.json();
        const recipe = data.meals[0]; // Get the full recipe details

        res.json({ recipe }); // Return recipe details as JSON
    } catch (error) {
        console.error('Error fetching recipe details:', error);
        res.status(500).json({ error: 'Error fetching recipe details' });
    }
});

app.get('/favorites', isAuthenticated, async (req, res) => {
    const userID = req.session.userID; // Get the userID from the session
    const sql = `SELECT * FROM recipes WHERE userID = ? ORDER BY name`;
    try {
        const [rows] = await conn.query(sql, [userID]);
        res.render('favorites', { favorites: rows });
    } catch (error) {
        console.error('Error fetching favorites:', error);
        res.status(500).send('Failed to fetch favorites');
    }
});

app.post('/favorites/add', isAuthenticated, async (req, res) => {
    const { id, name, url } = req.body;
    const userID = req.session.userID; // Get the userID from the session

    const sql = `INSERT INTO recipes (recipeId, name, url, userID) VALUES (?, ?, ?, ?)`;
    try {
        await conn.query(sql, [id, name, url, userID]);
        res.status(201).send('Favorite added successfully');
    } catch (error) {
        console.error('Error adding favorite:', error);
        res.status(500).send('Failed to add favorite');
    }
});

app.post('/favorites/delete', isAuthenticated, async (req, res) => {
    const recipeId = req.body.recipeId; // Use body instead of query for POST
    const userID = req.session.userID; // Get the userID from the session

    const sql = `DELETE FROM recipes WHERE recipeId = ? AND userID = ?`;
    try {
        await conn.query(sql, [recipeId, userID]);
        res.redirect('/favorites'); // Redirect to favorites page after deletion
    } catch (error) {
        console.error('Error deleting favorite:', error);
        res.status(500).send('Failed to delete favorite');
    }
});

app.get('/favorites/:id', isAuthenticated, async (req, res) => {
    const recipeId = req.params.id;
    const userID = req.session.userID; // Get the userID from the session

    const sql = `SELECT * FROM recipes WHERE recipeId = ? AND userID = ?`;
    try {
        const [rows] = await conn.query(sql, [recipeId, userID]);
        if (rows.length > 0) {
            res.json(rows[0]); // Return the favorite recipe details as JSON
        } else {
            res.status(404).send('Favorite not found');
        }
    } catch (error) {
        console.error('Error fetching favorite:', error);
        res.status(500).send('Failed to fetch favorite');
    }
});

app.get("/dbTest", async(req, res) => {
    let sql = `select * from recipes`;
    const [rows] = await conn.query(sql);
    res.send(rows);
});

app.get('/indexInspo', async(req, res) => {
    let url = `https://foodish-api.com/api/`;
    let response = await fetch(url);
    let data = await response.json();
    let foodImage = data.image;
    console.log(foodImage);
    res.render("indexInspo", {"foodImage":foodImage});
});


//Middleware functions
function isAuthenticated(req, res, next){
    if(req.session.authenticated){
        next();
    } else{
        res.redirect("/login")
    }
}

app.listen(3050, ()=>{
    console.log("Express server running")
})