"use strict"

export function makeHttpRequest(method, url, body, callback) {
    // method should be "GET" or "POST"
    var request = new XMLHttpRequest()
    request.onreadystatechange = function() {
        if (this.readyState == 4) {
            if (this.status == 200) {
                callback(request.responseText, null)
            } else {
                callback(null, request.responseText)
            }
        }
    }
    request.open(method, url, true)
    request.send(body)
}

// Given an event, returns a string representing the day and time of the event
export function getTimeString(event) {
    var s = ["Po", "Út", "St", "Čt", "Pá"][event.day]
    s += " " + event.time_from + "–" + event.time_to
    if (event.week_parity == 1) {
        s += " (liché týdny)"
    } else if (event.week_parity == 2) {
        s += " (sudé týdny)"
    }
    return s
}

export function timeToInt(s) {
    // Parses times in the format 09:15
    return parseInt(s.substring(0,2)) * 60 + parseInt(s.substring(3,5))
}

export function timeToRatio(time) {
    var mint = timeToInt("07:00")
    var maxt = timeToInt("20:00")
    var ratio = Math.min(1, Math.max(0,(time-mint)/(maxt-mint)))
    return ratio
}

export function sortCourses(courses) {
    // Given an object containing courses, returns an array of courses
    // sorted alphabetically by their name.
    var coursesWithNames = []
    for (var courseId in courses) {
        coursesWithNames.push([courses[courseId].name, courses[courseId]])
    }
    coursesWithNames.sort()
    return coursesWithNames.map(function(a) {
        return a[1]
    })
}
