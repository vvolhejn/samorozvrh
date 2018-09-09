'use strict'

var util = require('./util')

export function createSchedule (queryArray, callback) {
  var onResponse = function (responseString, error) {
    if (error) {
      callback(null, error)
    } else if (!responseString) {
      callback(null, 'Server neodpovídá.')
    } else {
      var response = JSON.parse(responseString)
      if (response['error']) {
        callback(null, 'Chyba při tvorbě rozvrhu: ' + response['error'])
      } else {
        callback(response['data'], null)
      }
    }
  }

  util.makeHttpRequest('POST', 'solverquery/', JSON.stringify(queryArray), onResponse)
}

export function addCourse (courseCode, callback) {
  var onResponse = function (responseString, error) {
    if (error) {
      callback(null, error)
    } else if (!responseString) {
      callback(null, 'Server neodpovídá.')
    } else {
      var response = JSON.parse(responseString)
      if (response['error']) {
        if (response['error'] === 'The course has no scheduled events') {
          callback(null, 'Předmět ' + courseCode + ' není rozvržený.')
        } else {
          callback(
            null,
            'Nepodařilo se najít rozvrh předmětu ' + courseCode + '. ' +
            'Zkontrolujte prosím, že je kód zadán správně, a že je předmět už rozvržený.'
          )
        }
      } else {
        callback(response['data'], null)
      }
    }
  }
  util.makeHttpRequest('GET', 'sisquery/' + encodeURIComponent(courseCode), null, onResponse)
}
