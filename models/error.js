var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ErrorsSchema = new Schema({
  date: Date,
  request: String,
  err: String
});

module.exports = mongoose.model('Error', ErrorsSchema);
