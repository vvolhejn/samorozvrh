'use strict'

var util = require('./util')

/**
 * Creates the server query for creating the schedule
 */
export function createScheduleQuery (courses) {
  const REWARDS = [1, 100, 10000]
  const DEFAULT_ALLOWED_TRANSFER_OVERLAP = 5 // How many minutes is it ok to come late

  let queryCourses = []

  // maps sent data to application data
  let queryMap = []

  // courses actually sent to the server
  let sentCourses = courses.filter(c => c.allowed && c.groups.some(g => g.allowed))

  for (let i = 0; i < sentCourses.length; i++) {
    let course = sentCourses[i]
    let sentGroups = course.groups.filter(g => g.allowed)

    queryCourses.push({
      id: course.type + ';' + course.name, // TODO: does the server need this argument?
      name: course.name,
      reward: REWARDS[(course.priority || 2) - 1],
      options: sentGroups.map(g => g.serializeForBackendQuery())
    })

    queryMap.push({
      course: course,
      sentGroups: sentGroups
    })
  }

  let query = {
    'data': queryCourses,
    'options': { 'allowed_transfer_overlap': DEFAULT_ALLOWED_TRANSFER_OVERLAP }
  }

  return [query, queryMap]
}

export function createSchedule (query, callback) {
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

  util.makeHttpRequest('POST', 'solverquery/', JSON.stringify(query), onResponse)
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
