var mongoose = require('mongoose');
var passport = require('passport');
var config = require('../config/database');
require('../config/passport')(passport);
var express = require('express');
var jwt = require('jsonwebtoken');
var router = express.Router();
var User = require("../models/user");
var Item = require("../models/item");
var getDateFromTo = require("../helpers/get-from-to-dates")

router.post('/signup', function(req, res) {
  if (!req.body.username || !req.body.password) {
    res.json({success: false, message: 'Please pass username and password.'});
  } else {
    var newUser = new User({
      username: req.body.username,
      password: req.body.password
    });
    // save the user
    newUser.save(function(err) {
      if (err) {
        return res.json({success: false, message: 'Username already exists.'});
      }
      res.json({success: true, message: 'Successful created new user.'});
    });
  }
});

router.post('/signin', function(req, res) {
  User.findOne({
    username: req.body.username
  }, function(err, user) {
    console.log(req.body)
    if (err) throw err;

    if (!user) {
      res.status(401).send({success: false, type: 'error', message: 'Пользователь не найден'});
    } else {
      // check if password matches
      user.comparePassword(req.body.password, function (err, isMatch) {
        if (isMatch && !err) {
          // if user is found and password is right create a token
          var token = jwt.sign({ username: user.username }, config.secret);
          // return the information including token as JSON
          res.json({success: true, token: 'JWT ' + token });
        } else {
          res.status(401).send({success: false, type: 'error', message: 'Пароль не верен'});
        }
      });
    }
  });
});

router.get('/items', function(req, res, next) {
  const { date, type } = req.query
  const dateQuery = getDateFromTo(date)

  const primerkaQuery = {
    primerkaDate: dateQuery,
    type: type
  }
  const primerkaSort = {
    primerkaDate: 1
  }

  const reservQuery = {
    eventDate: dateQuery,
    type: type
  }
  const reservSort = {
    eventDate: 1
  }

  const query = type == 1 ? reservQuery : primerkaQuery
  const sort = type === 1 ? reservSort : primerkaSort

  Item.find(query, {}, {
    sort
}, function (err, items) {
    if (err) return next(err);
    res.json(items);
  });
});

router.delete('/item/delete', passport.authenticate('jwt', { session: false }), function(req, res) {
  var token = getToken(req.headers);

  if (token) {
    Item.remove({ _id: req.body.id }, function (err, item) {
      if (err) return handleError(err);

      res.json({ success: true, type: 'warning', message: 'Удаление прошло успешно'});
    });
  } else {
    return res.status(403).send({success: false, type: 'error', message: 'Вы не залогинены'});
  }
});

router.post('/item/add', passport.authenticate('jwt', { session: false}), function(req, res) {
  var token = getToken(req.headers);
  if (token) {
    var newItem = new Item({
      ...req.body
    });

    newItem.save(function(err) {
      if (err) {
        return res.json({success: false, type: 'error', message: 'Произошла ошибка'});
      }
      res.json({success: true, type: 'success', message: 'Добавление прошло успешно'});
    });
  } else {
    return res.status(403).send({success: false, type: 'error', message: 'Вы не залогинены'});
  }
});

router.patch('/item/edit', passport.authenticate('jwt', { session: false }), function(req, res) {
  var token = getToken(req.headers);
  if (token) {
    Item.findById(req.body._id, function (err, item) {
      if (err) return handleError(err);
    
      item.set(req.body);
      item.save(function (err, updatedItem) {
        if (err) return handleError(err);
        res.json({ success: true, type: 'success', message: 'Обновление прошло успешно'});
      });
    });
  } else {
    return res.status(403).send({success: false, type: 'error', message: 'Вы не залогинены'});
  }
});


router.get('/items/:id', function(req, res, next) {
    Item.findById(req.params.id, function (err, item) {
      if (err) return next(err);
      res.json(item);
    });
});


getToken = function (headers) {
  if (headers && headers.authorization) {
    var parted = headers.authorization.split(' ');
    if (parted.length === 2) {
      return parted[1];
    } else {
      return null;
    }
  } else {
    return null;
  }
};

module.exports = router;
