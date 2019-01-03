const fs = require('fs')
const path = require('path')
const min = 64;
const max = 74;

exports.getTemperature = function () {
  return Math.random() * (max - min) + min;
}
