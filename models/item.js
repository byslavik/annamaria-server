var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ItemSchema = new Schema({
  dressIds: Array,
  clientPhone: String,
  clientName: String,
  primerkaDate: Date,
  eventDate: Date,
  isVidacha: Boolean,
  comments: String
});

module.exports = mongoose.model('Item', ItemSchema);
