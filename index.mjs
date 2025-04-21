import express from 'express';
import mysql from 'mysql2/promise';

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));

//for Express to get values using POST method
app.use(express.urlencoded({extended:true}));

//Just using this info as a placeholder
//We can change it when we set up a new db
const pool = mysql.createPool({
    host: "notatechblog.tech",
    user: "notatech_webuser",
    password: "asdfjkl;qweruiop",
    database: "notatech_quotes",
    connectionLimit: 10,
    waitForConnections: true
});
const conn = await pool.getConnection();

//routes
app.get('/', async(req, res) => {
    
   res.render('index', 
    {users: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]})
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

app.listen(3050, ()=>{
    console.log("Express server running")
})