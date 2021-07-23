const express = require("express");
const { check, validationResult } = require('express-validator');
const Handlebars = require('handlebars')
const expressHandlebars = require('express-handlebars')
const {allowInsecurePrototypeAccess} = require('@handlebars/allow-prototype-access')

const Restaurant = require('./models/restaurant');
const Menu = require('./models/menu');
const MenuItem = require('./models/menuItem');

const initialiseDb = require('./initialiseDb');
initialiseDb();

const app = express();
const port = 3000;

//Configures handlebars library to work well w/ Express + Sequelize model
const handlebars = expressHandlebars({
    handlebars : allowInsecurePrototypeAccess(Handlebars)
})

//Tell this express app we're using handlebars
app.engine('handlebars', handlebars);
app.set('view engine', 'handlebars')

app.use(express.static('public'));

app.use(express.json());

//so req.body is not undefined
app.use(express.urlencoded());


const restaurantChecks = [
    check('name').not().isEmpty().trim().escape(),
    check('image').isURL(),
    check('name').isLength({ max: 50 })
]

app.get('/restaurants', async (req, res) => {
    const restaurants = await Restaurant.findAll();
    res.render('restaurants', {restaurants});
});

app.get('/restaurants/:id', async (req, res) => {
    const restaurant = await Restaurant.findByPk(req.params.id, {include: {
            model: Menu,
            include: MenuItem
        }
    });
    //console.log(restaurant);
    res.render('restaurant', {restaurant});
});

app.post('/restaurants', restaurantChecks, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    await Restaurant.create(req.body);
    res.sendStatus(201);
});

//DELETE ROUTE
app.post('/delete/:id', async (req, res) => {
    console.log("destroy restaurant")
    await Restaurant.destroy({
        where: {
            id: req.params.id
        }
    });
    //res.sendStatus(200);
    res.redirect('/restaurants');
});

app.put('/restaurants/:id', restaurantChecks, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const restaurant = await Restaurant.findByPk(req.params.id);
    await restaurant.update(req.body);
    res.sendStatus(200);
});

app.patch('/restaurants/:id', async (req, res) => {
    const restaurant = await Restaurant.findByPk(req.params.id);
    await restaurant.update(req.body);
    res.sendStatus(200);
});

app.get('/menus', async (req, res) => {
    const menus = await Restaurant.findAll();
    res.render('menus', {menus});
});

// FORMS --------------------------------------------------------------------------------------------

app.get('/new-restaurant-form', (req, res) => {
    res.render('newRestaurantForm')
})

app.post('/new-restaurant', async (req, res) => {
    let newRestaurant = await Restaurant.create(req.body)
    const foundNewRestaurant = await Restaurant.findByPk(newRestaurant.id)
    //if new sauce was created, send 201 status
    if(foundNewRestaurant) {
        res.status(201).send('New restaurant success')
        //res.render('restaurants')
    } else {
        console.error('restaurant not created')
    }
})

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});