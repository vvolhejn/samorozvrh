'use strict'

import Handlebars from './lib/handlebars-v4.0.11'
var util = require('./util')

var courseListTemplate, scheduleTemplate

export function renderCourseList (courses) {
  var sortedCourses = util.sortCourses(courses)

  var tbody = document.getElementById('course_table_body')
  tbody.innerHTML = courseListTemplate(sortedCourses)

    // Set the radio buttons to the previously set value
  for (var i = 0; i < sortedCourses.length; i++) {
    var priority = sortedCourses[i].priority || 2
    var id = 'radio' + priority + i
    var radio = document.getElementById(id)
    radio.checked = true
  }
}

export function renderSchedule (groupsByDay) {
  var templateGroupsByDay = groupsByDay.map(function (g, i) {
    return {
      day: ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek'][i],
      groups: g
    }
  })
  var templateData = {
    timestamps: ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'],
    groupsByDay: templateGroupsByDay
  }

  var schedule = document.getElementById('schedule')
  schedule.innerHTML = scheduleTemplate(templateData)
}

export function setStatusMessage (s) {
  document.getElementById('status').innerHTML = s
}

export function initHandlebars (selectedOptions) {
  Handlebars.registerHelper('all_times', function () {
    return new Handlebars.SafeString(
            this.map(util.getTimeString).join('; ')
        )
  })

  Handlebars.registerHelper('course_allowed', function () {
    return this.options.some(function (o) { return o.allowed })
  })

  Handlebars.registerHelper('highlight_selection', function (course) {
    if (this.optionId === selectedOptions[course]) {
      return 'selected_course'
    } else {
      return ''
    }
  })

  Handlebars.registerPartial('group_id', '{{@../index}}-{{@index}}')

  Handlebars.registerHelper('event_style', function () {
    var fc = util.timeToRatio(util.timeToInt(this.time_from))
    var tc = util.timeToRatio(util.timeToInt(this.time_to))
    var formatPercent = function (x) {
      return (x * 100) + '%'
    }
    return 'left: ' + formatPercent(fc) +
                ';width: ' + formatPercent(tc - fc) + ';'
  })

  Handlebars.registerHelper('time_to_percent', function (timeString) {
    return (util.timeToRatio(util.timeToInt(timeString)) * 100) + '%'
  })

  var source = document.getElementById('course_list_template').innerHTML
  courseListTemplate = Handlebars.compile(source)

  source = document.getElementById('schedule_template').innerHTML
  scheduleTemplate = Handlebars.compile(source)
}
