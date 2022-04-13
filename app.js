const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const exphbs = require('express-handlebars');
const urlencoded = require('body-parser/lib/types/urlencoded');
const { application } = require('express');
const cookieParser = require('cookie-parser');

const app = express();
const port = process.env.PORT || 9000

// Parse body
app.use(bodyParser.urlencoded({extended: false}));

// parse application/json
app.use(bodyParser.json()); // https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/JSON
// https://developer.mozilla.org/en-US/docs/Web/API/Response/json#example

app.use(express.static('public'));
app.use(cookieParser());

require('dotenv').config();

// Templating Egine
app.engine('hbs', exphbs.engine({extname:'.hbs'}));
app.set('view engine', 'hbs');

// Connect to DB
const pool = mysql.createPool({
    connectionLimit: 100,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
})

pool.getConnection((err, connection) => {
    if(err) throw err;  // Error Message
    console.log(`Connected as ID ${connection.threadId}`)
})


// Setup routes
// userController.js ---> user.js ---> app.js
const routes = require('./server/routes/user');
app.use('/', routes);




app.listen(port, () => {
    console.log(`Listening on port ${port}`)
});

