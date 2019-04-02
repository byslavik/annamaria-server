var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CommentSchema = new Schema({
  comment: String,
  date: Date
});

module.exports = mongoose.model('Comment', CommentSchema);
