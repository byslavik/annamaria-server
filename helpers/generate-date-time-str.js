const generateDateTimeStr = datetime => console.log(datetime) ||  typeof datetime === 'string' ?
  datetime :
  datetime && [datetime.date, datetime.time].filter(Boolean).join('T')

module.exports = generateDateTimeStr