import express from 'express';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import session from 'express-session';

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));

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
        console.log (req.session.userID);
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
        console.log(passHash);
    
    
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

app.get('/ingredients', isAuthenticated, async(req, res) => {
    
    res.render('ingredients', 
     {ingredients: [{ ingredientId: 1, name: 'Tomato', quantity: 10, unit: 'pcs' }]})
 });

app.get('/ingredients/add', async(req, res) => {
    res.render('addIngredient')
 });

app.post('/ingredients/add', (req, res) => {
  const { name, quantity, unit } = req.body;
  if (!name || !quantity || !unit) {
    return res.status(400).send('All fields are required.');
  }
  console.log({ name, quantity, unit });
  // Redirect back to main index or inventory view
  res.redirect('/ingredients');
});

app.get("/ingredients/edit", async function(req, res){
    let ingredientId = req.query.ingredientId;
    let sql = ``;
    const [rows] = [];
    res.render("editIngredient", {ingredientInfo: [{ ingredientId: ingredientId, name: 'Tomato', quantity: 10, unit: 'pcs' }]});
   });

app.post("/ingredients/edit", async function(req, res){
  const {ingredientId, name, quantity, unit } = req.body;
  let sql = ``;
  console.log({ ingredientId, name, quantity, unit });
  //const [rows] = await conn.query(sql,params);
  res.redirect("/ingredients");
});

app.get("/ingredients/delete", async function(req, res){
    let ingredientId = req.query.ingredientId;
    let sql = ``;
    console.log(ingredientId);
    //const [rows] = await conn.query(sql, []);
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

app.get('/recipes', isAuthenticated, (req, res) => {
    res.render('recipes'); // Render the recipes.ejs page
});


app.get('/recipes/search', async (req, res) => {
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

app.get('/recipes/:id', async (req, res) => {
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

app.get("/dbTest", async(req, res) => {
    let sql = `select * from recipes`;
    const [rows] = await conn.query(sql);
    res.send(rows);
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