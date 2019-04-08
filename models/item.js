var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ItemSchema = new Schema({
  dressIds: Array,
  clientPhone: String,
  clientName: String,

  primerkaDate: Object,
  primerkaDateStr: Date,

  eventDate: Object,
  eventDateStr: Date,

  reservDate: Object,
  reservDateStr: Date,

  returnDate: Object,
  returnDateStr: Date,

  isVidacha: Boolean,
  placeholder: Boolean,
  comments: String,
  isPrimerkaDone: Boolean,
  isVidachaDone: Boolean,
  isReturnDone: Boolean,
  type: Number,
  zalog: Number,
  prepaid: Number,
  prise: Number
});

module.exports = mongoose.model('Item', ItemSchema);
