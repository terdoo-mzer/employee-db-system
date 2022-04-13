const express = require('express');
const router = express.Router();
const userController = require('../controllers/userControllers');


router.get('/', userController.isLoggedIn, (req, res) => {
    res.render('home', {
        user: req.user
    })
}); // Get landing page route

router.get('/registerEmployee', userController.form) // Employee reg page
router.post('/registerEmployee', userController.create)

router.get('/employeeLogin', userController.loginForm)
router.post('/employeeLogin', userController.login)


router.get('/profile', userController.isLoggedIn, (req, res) => {
    if(req.user) {
        res.render('profile', {
            user:req.user
        }); 
    } else {
        res.redirect('/employeeLogin');
    }
})

router.get('/logout', userController.logout)

module.exports = router;