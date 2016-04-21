"use strict";

class Utils {

  static getRandomInt(min, max) {

      if (min === undefined) {
        min = 1;
      }

      if (max === undefined) {
        max = 99999999999;
      }

      return Math.floor(Math.random() * (max - min +1)) + min
  }

}

module.exports = Utils;
