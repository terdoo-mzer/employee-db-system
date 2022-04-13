const res = require('express/lib/response');
const mysql = require('mysql');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');


// Connection Pool
const pool = mysql.createPool({
    connectionLimit: 100,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
})

// // Render Home page
// exports.landing = (req, res) => {
//     res.render('home')
// };

// Render registration Form
exports.form = (req, res) => {
    res.render('register-employee');
}

// Render Login page
exports.loginForm = (req, res) => {
    res.render('login')
}

// Validate and log user in
exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).render('login', { message: 'Please provide all the login details' })
        }
    } catch (err) {
        throw err
    }
    pool.getConnection((err, connection) => {
        if (err) throw err;
        console.log(`Connected as ID ${connection.threadId}`);

        connection.query(`SELECT * FROM employee WHERE email = ?`, [email], async (err, results) => {
            // https://stackoverflow.com/questions/49847079/unexpected-identifier-when-using-bcrypt

            console.log(results);
            if (!results || !(await bcrypt.compare(password, results[0].password))) {
                res.status(401).render('login', {
                    message: 'Email or Password is incorrect'
                })
            } else {
                const id = results[0].employee_id;

                const token = jwt.sign({ id }, process.env.JWT_SECRET, {
                    expiresIn: process.env.JWT_EXPIRES_IN
                });

                console.log("The token is: " + token);

                const cookieOptions = {
                    expires: new Date(
                        Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
                    ),
                    httpOnly: true
                }

                res.cookie('jwt', token, cookieOptions);
                res.status(200).redirect("/");
            }
        })
    })
}

// Add employee to database
exports.create = (req, res) => {
    const { first_name, last_name, email, phone, gender, password, confirm_password } = req.body;
    if (!first_name || !last_name || !email || !phone || !gender || !password || !confirm_password) {
        return res.status(400).render('register-employee', { message: 'Please fill in all the fields' })
    }
    // console.log(req.body)
    pool.getConnection((err, connection) => {
        if (err) throw err;
        console.log(`Connected as ID ${connection.threadId}`);

        connection.query(`SELECT email, employee_id FROM employee WHERE email = ?`, [email], async (err, results) => {
            if (err) {
                console.log(err)
            }

            if (results.length > 0) {
                return res.render('register-employee', { message: 'That email is already in use' })
            } else if (password !== confirm_password) {
                return res.render('register-employee', { message: 'Passwords do not match' })
            }

            let hashedPassword = await bcrypt.hash(password, 8);

            connection.query(`INSERT INTO employee SET first_name = ?, last_name = ?, email = ?, phone = ?, gender = ?, password = ?`, [first_name, last_name, email, phone, gender, hashedPassword], (err, results) => {
                connection.release();
                if (!err) {
                    res.render('register-employee', { submitted: 'User added successfully!' });
                } else {
                    res.render({ submitted: 'Not submitted' })
                }
            })
        })
    })
};


exports.isLoggedIn = async (req, res, next) => {
    console.log(req.cookies)
    if (req.cookies.jwt) {
        try {

            // 1. Verify the the toke
            const decoded = await promisify(jwt.verify)(req.cookies.jwt,
                process.env.JWT_SECRET)
            console.log(decoded)

            // 2. Check if the user still exits

            pool.getConnection((err, connection) => {
                if (err) throw err;

                connection.query(`SELECT * FROM employee WHERE employee_id = ?`, [decoded.id], (err, results) => {
                    console.log(results);

                    if (!results) {
                        return next();
                    }

                    req.user = results[0];
                    console.log("user is")
                    console.log(req.user);
                    return next();
                })
            })

        } catch (err) {
            console.log(err)
        }
    } else {
        next();
    }
}

exports.logout = async (req, res) => {
    res.cookie('jwt', 'logout', {
      expires: new Date(Date.now() + 2*1000),
      httpOnly: true
    });
  
    res.status(200).redirect('/');
  }
