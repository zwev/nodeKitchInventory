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
app.get('/', async(req, res) => {
    
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

app.get('/ingredients', async(req, res) => {
    
    res.render('ingredients', 
     {ingredients: [{ name: 'Tomato', quantity: 10, unit: 'pcs' }]})
 });

app.get('/ingredients/add', async(req, res) => {
    
    res.render('addIngredient')
 });
 
app.get('/user/add', async(req, res) => {
    
    res.render('addUser')
 });

app.get("/dbTest", async(req, res) => {
    let sql = "select * from q_quotes";
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