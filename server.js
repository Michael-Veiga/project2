const express = require('express');
// express-session module thats allows you to get and set data
const session = require('express-session');
const passport = require('./config/passport');
const db = require('./models');

const app = express();

const PORT = process.env.PORT || 8093;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

app.use(
  session({ secret: 'keyboard cat', resave: true, saveUninitialized: true })
);
app.use(passport.initialize());
app.use(passport.session());

require('./routes/api-routes')(app);
require('./routes/html-routes')(app);

// Sync sequelize models then start Express app
// =============================================
db.sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`App listening on PORT ${PORT}`);
  });
});
