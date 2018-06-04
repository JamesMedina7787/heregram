var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var morgan = require('morgan');
var User = require('./models/user');
const ejs = require('ejs');
const multer = require('multer');
const Sequelize = require('sequelize');
const path = require('path');
const fs = require('fs');
const db = require('./server/config/db.js');
// const Pic = require(__dirname + '/server/model/models/pic');
// const Like = require(__dirname + '/server/model/models/like');
// const UserComment = require(__dirname + '/server/model/models/usercomment');
const ejsLint = require('ejs-lint');
const env = require('./server/config/env');
// sync sequelize instance with our local postgres database.
db.sequelize.sync().then(function() {
    console.log('Nice! Database looks fine');
}).catch(function(err) {
    console.log(err, 'Something went wrong with the Database Update!');
});
// invoke an instance of express application.
var app = express();

// set our application port
app.set('port', 3000);
app.set('view engine', 'ejs');
// set morgan to log info about our requests for development use.
app.use(morgan('combined'));
app.use(bodyParser.json())

// initialize body-parser to parse incoming parameters requests to req.body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'))
    // initialize cookie-parser to allow us access the cookies stored in the browser. 
app.use(cookieParser());

// initialize express-session to allow us track the logged-in user across sessions.
app.use(session({
    key: 'user_sid',
    secret: 'somerandonstuffs',
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 600000
    }
}));

// This middleware will check if user's cookie is still saved in browser and user is not set, then automatically log the user out.
// This usually happens when you stop your express server after login, your cookie still remains saved in the browser.
app.use((req, res, next) => {
    if (req.cookies.user_sid && !req.session.user) {
        res.clearCookie('user_sid');
    }
    next();
});

// middleware function to check for logged-in users
var sessionChecker = (req, res, next) => {
    if (req.session.user && req.cookies.user_sid) {
        res.redirect('/dashboard');
    } else {
        next();
    }
};

// route for Home-Page
app.get('/', sessionChecker, (req, res) => {
    res.redirect('/login');
});

// multer related
const storage = multer.diskStorage({
    destination: './public/uploads',
    filename: (req, file, cb) => {
        // fieldname is name="photo", - "154461".jpg. naming convention has to be unique. 
        // Date.now() would be different for everyone.
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
})

// upload process definition
const upload = multer({
    storage: storage
}).single('image');

const PicUserComment = db.sequelize.define('picusercomment', {
    // these columns wlll be auto-created by sequelize
    pic_id: Sequelize.INTEGER,
    usercomment_id: Sequelize.INTEGER
})
const UserPic = db.sequelize.define('userpic', {
    user_id: Sequelize.INTEGER,
    pic_id: Sequelize.INTEGER
})

// define Pic
const Pic = db.sequelize.define('pic', {
    name: Sequelize.STRING,
    description: Sequelize.STRING,
    image: Sequelize.STRING
})

const UserComment = db.sequelize.define('usercomment', {
    content: Sequelize.STRING
})

Pic.belongsToMany(UserComment, {
    through: 'picusercomment'
});
UserComment.belongsToMany(Pic, { through: 'picusercomment' });

User.belongsToMany(Pic, {
    through: 'userpics'
});
Pic.belongsToMany(User, {
    through: 'userpics'
});

// get route for multer pics
let name;
let description;

//get route
app.get('/heregram', (req, res) => {

    Pic.findAll().then((data) => {
        const links = data.map(function(dataValues) {
            return [dataValues.url, dataValues.id];
        })

        res.render('pages/heregram', { imageUrls: links });
    })
})

app.get('/heregram', (req, res) => {
    Pic.findAll({ include: [{ User }] }).then(function(data) {
        const imageDataArr = data.map(function(dataValues) {
            let links = {};
            // links.username = dataValues.user.username;
            links.id = dataValues.id;
            links.url = dataValues.url;
            return links;
        })
        return imageDataArr;
    }).then((imageDataArr) => {
        res.render('pages/heregram', {
            imageDataArr
        })
    })
})


//upload route
app.post('/upload', (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            console.log(err);
        }
        console.log(req.body);
        console.log(req.file);

        Pic.create({
                userId: req.user.id,
                url: req.file.location,
                name: req.body.name,
                description: req.body.description
            })
            .then(() => {
                return res.redirect('/heregram')
            })
    })

})

app.get('/heregram', (req, res) => {
    res.render('pages/heregram');
})

// route for user signup
app.route('/signup')
    .get(sessionChecker, (req, res) => {
        res.sendFile('signup.html', { root: 'public' });
    })
    .post((req, res) => {
        User.create({
                username: req.body.username,
                email: req.body.email,
                password: req.body.password
            })
            .then(user => {
                req.session.user = user.dataValues;
                res.redirect('/dashboard');
            })
            .catch(error => {
                res.redirect('/signup');
            });
    });

// route for user Login
app.route('/login')
    .get(sessionChecker, (req, res) => {
        res.sendFile('login.html', { root: 'public' });
    })
    .post((req, res) => {
        var username = req.body.username,
            password = req.body.password;

        User.findOne({ where: { username: username } }).then(function(user) {
            if (!user) {
                res.redirect('/login');
            } else if (!user.validPassword(password)) {
                res.redirect('/login');
            } else {
                req.session.user = user.dataValues;
                res.redirect('/dashboard');
            }
        });
    });

// route for user's dashboard
app.get('/dashboard', (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
        res.sendFile('dashboard.html', { root: 'public' });
    } else {
        res.redirect('/login');
    }
});

// route for user logout
app.get('/logout', (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
        res.clearCookie('user_sid');
        res.redirect('/');
    } else {
        res.redirect('/login');
    }
});

// route for handling 404 requests(unavailable routes)
app.use(function(req, res, next) {
    res.status(404).send("Sorry can't find that!")
});

// start the express server
app.listen(app.get('port'), () => console.log(`App started on port ${app.get('port')}`));