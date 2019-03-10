var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ItemSchema = new Schema({
  dressIds: Array,
  clientPhone: String,
  clientName: String,
  primerkaDate: Date,
  eventDate: Date,
  reservDate: Date,
  isVidacha: Boolean,
  placeholder: Boolean,
  comments: String,
  type: Number,
  zalog: Number,
  prepaid: Number,
  prise: Number
});

module.exports = mongoose.model('Item', ItemSchema);
