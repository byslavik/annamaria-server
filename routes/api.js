var mongoose = require('mongoose');
var passport = require('passport');
var config = require('../config/database');
require('../config/passport')(passport);
var express = require('express');
var jwt = require('jsonwebtoken');
var router = express.Router();
var User = require("../models/user");
var Item = require("../models/item");

router.post('/signup', function(req, res) {
  if (!req.body.username || !req.body.password) {
    res.json({success: false, msg: 'Please pass username and password.'});
  } else {
    var newUser = new User({
      username: req.body.username,
      password: req.body.password
    });
    // save the user
    newUser.save(function(err) {
      if (err) {
        return res.json({success: false, msg: 'Username already exists.'});
      }
      res.json({success: true, msg: 'Successful created new user.'});
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
      res.status(401).send({success: false, type: 'danger', msg: 'Пользователь не найден'});
    } else {
      // check if password matches
      user.comparePassword(req.body.password, function (err, isMatch) {
        if (isMatch && !err) {
          // if user is found and password is right create a token
          var token = jwt.sign({ username: user.username }, config.secret);
          // return the information including token as JSON
          res.json({success: true, token: 'JWT ' + token });
        } else {
          res.status(401).send({success: false, alertType: 'danger', msg: 'Пароль не верен'});
        }
      });
    }
  });
});

router.get('/items', function(req, res) {
  Item.find({}, function (err, items) {
    if (err) return next(err);
    res.json(items);
  });
});

router.post('/item/delete', passport.authenticate('jwt', { session: false }), function(req, res) {
  var token = getToken(req.headers);
  console.log(token)
  if (token) {
    Item.remove({ _id: req.body.id }, function (err, item) {
      if (err) return handleError(err);

      res.json({ success: true, alertType: 'success', msg: 'Удаление прошло успешно'});
    });
  } else {
    return res.status(403).send({success: false, alertType: 'danger', msg: 'Вы не залогинены'});
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
        return res.json({success: false, alertType: 'danger', msg: 'Произошла ошибка'});
      }
      res.json({success: true, alertType: 'success', msg: 'Добавление прошло успешно'});
    });
  } else {
    return res.status(403).send({success: false, alertType: 'danger', msg: 'Вы не залогинены'});
  }
});

router.post('/item/edit', passport.authenticate('jwt', { session: false }), function(req, res) {
  var token = getToken(req.headers);
  if (token) {
    Item.findById(req.body._id, function (err, item) {
      if (err) return handleError(err);
    
      item.set(req.body);
      item.save(function (err, updatedItem) {
        if (err) return handleError(err);
        res.json({ success: true, alertType: 'success', msg: 'Обновление прошло успешно'});
      });
    });
  } else {
    return res.status(403).send({success: false, alertType: 'danger', msg: 'Вы не залогинены'});
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
