var mongoose = require('mongoose');
var passport = require('passport');
var path = require('path')
var backup = require('mongodb-backup')
var config = require('../config/database');
require('../config/passport')(passport);
var express = require('express');
var jwt = require('jsonwebtoken');
var router = express.Router();
var User = require("../models/user");
var Item = require("../models/item");
var Comment = require("../models/comment");
var getDateFromTo = require("../helpers/get-from-to-dates")
var generateDateTimeStr = require("../helpers/generate-date-time-str")

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

// router.get('/migrate', function(req, res) {
//   Item.find({ type: 1 }, (err, items) => {
//     items.forEach(prevItem => {
//       Item.findById(prevItem._id, function (err, item) {
//         if (err) return handleError(err);

//         const itemToSave  = {
//           ...prevItem,
//           isPrimerkaDone: true,
//           isVidachaDone: false,
//           isReturnDone: false,
//         }

//         item.set(itemToSave);
//         item.save(function (err, updatedItem) {
//           if (err) return handleError(err);
//         });
//       });
//     })
//     res.json({ done: true })
//   })
// })

router.get('/items', function(req, res, next) {
  const { date, type } = req.query
  const dateQuery = getDateFromTo(date)

  const primerkaQuery = {
    primerkaDateStr: dateQuery
  }
  const primerkaSort = {
    primerkaDateStr: 1
  }

  const reservQuery = {
    eventDateStr: dateQuery,
    isPrimerkaDone: true
  }
  const reservSort = {
    eventDateStr: 1
  }

  const allDateQuery = {
    $or: [
      {
        primerkaDateStr: dateQuery,
      },
      {
        reservDateStr: dateQuery,
      },
      {
        returnDateStr: dateQuery,
      }
    ]
  }

  let query = allDateQuery
  let sort = {}

  if (type === '1') {
    query = reservQuery
    sort = reservSort
  }

  if (type === '0') {
    query = primerkaQuery
    sort = primerkaSort
  }

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
    Item.deleteOne({ _id: req.body.id }, function (err, item) {
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
    const body = req.body
    const itemToSave  = {
      ...body,
      primerkaDateStr: generateDateTimeStr(body.primerkaDate),
      eventDateStr: generateDateTimeStr(body.eventDate),
      reservDateStr: generateDateTimeStr(body.reservDate),
      returnDateStr: generateDateTimeStr(body.returnDate),
    }
    var newItem = new Item(itemToSave);
    console.log(newItem)

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
      const body = req.body
      const itemToSave  = {
        ...body,
        primerkaDateStr: generateDateTimeStr(body.primerkaDate),
        eventDateStr: generateDateTimeStr(body.eventDate),
        reservDateStr: generateDateTimeStr(body.reservDate),
        returnDateStr: generateDateTimeStr(body.returnDate),
      }
      console.log(itemToSave)
      item.set(itemToSave);
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


router.get('/backup-db', function(req, res) {
  var filename = `dump-${Date.now()}.tar`
  var root = path.resolve(__dirname, '../backups')

  backup({
    uri: config.database,
    root, 
    tar: filename,
    callback: function(err) {
      if (err) {
        console.error(err);
      } else {
        res.sendFile(filename, { root })
      }
    }
  });
});

router.get('/comment', function(req, res, next) {
  const { date } = req.query
  const dateQuery = getDateFromTo(date)

  const query = {
    date: dateQuery
  }

  Comment.find(query, function (err, items) {
    if (err) return next(err);
    res.json(items);
  });
});

router.patch('/comment', passport.authenticate('jwt', { session: false}), function(req, res) {
  var token = getToken(req.headers);
  if (token) {
    Comment.findById(req.body._id, function (err, item) {
      if (err) return handleError(err);
      const body = req.body
      
      item.set(body);
      item.save(function (err, updatedItem) {
        if (err) return handleError(err);
        res.json({ success: true, type: 'success', message: 'Обновление прошло успешно'});
      });
    });
  } else {
    return res.status(403).send({success: false, type: 'error', message: 'Вы не залогинены'});
  }
});

router.post('/comment', passport.authenticate('jwt', { session: false}), function(req, res) {
  var token = getToken(req.headers);
  if (token) {
    const body = req.body
    var newItem = new Comment(body);

    newItem.save(function(err) {
      if (err) {
        return res.json({success: false, type: 'error', message: 'Произошла ошибка'});
      }
      res.json({success: true, type: 'success', message: 'Добавление заметки прошло успешно'});
    });
  } else {
    return res.status(403).send({success: false, type: 'error', message: 'Вы не залогинены'});
  }
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
