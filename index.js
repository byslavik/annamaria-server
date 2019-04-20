var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var config = require('./config/database');
var ErrorShema = require("./models/error");
var cors = require('cors');
var port = process.env.PORT || 8083;

mongoose.connect(config.database, { useNewUrlParser: true });
var conn = mongoose.connection;

conn.on('error', function(err) {
  console.log('noup', err)
});

conn.once('open', function() {
  console.log('horaay... I`m connected')
});

var api = require('./routes/api');

var app = express();

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST");
  
  next();
});
app.use(express.static('built'))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(passport.initialize());
app.use(cors())
app.use('/api', api);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  var newError = new ErrorShema({
    date: Date.now(),
    request: JSON.stringify({ url: req.path, query: req.query, body: req.body }),
    err: JSON.stringify(err),
  });

  newError.save(function(err) {
    if (err) {
      res.status(403).send({success: false, type: 'error', message: 'Что-то пошло не так. '});
    }

    res.status(403).send({success: false, type: 'error', message: 'Что-то пошло не так. Ошибка сохранена. Обратитесь к администратору'});
  });

});

app.listen(port)

module.exports = app;
