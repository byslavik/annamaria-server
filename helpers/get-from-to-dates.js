const getFromToDate = date => {
  const currentDate = new Date(`${date} 00:00`)

  const day = currentDate.getDate()
  const month = currentDate.getMonth() + 1
  const year = currentDate.getFullYear()

  return {
    $gte: new Date(`${year} ${month} ${day} 00:00:00`),
    $lt: new Date(`${year} ${month} ${day} 23:59:59`)
  }
}

module.exports = getFromToDate