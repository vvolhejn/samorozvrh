"use strict"

var util = require('./util');
var view = require('./view');
var backendQuery = require('./backendQuery');

var REWARDS = [1,100,10000]

export var courses = {}
var loadedCourseCodes = {}
var selectedOptions = {}

view.initHandlebars(selectedOptions)

export function addCourse() {
    var courseCode = document.getElementById("course_code").value
    if (loadedCourseCodes[courseCode]) {
        view.setStatusMessage("Předmět " + courseCode + " už je přidán")
        return false
    }
    backendQuery.addCourse(courseCode, function(res, err) {
        if (err) {
            view.setStatusMessage("Chyba: " + err)
        } else {
            res.forEach(addGroup)
            view.renderCourseList(courses)
            loadedCourseCodes[courseCode] = true
            view.setStatusMessage("Přidán předmět " + courseCode)
        }
    })
    view.setStatusMessage("Hledám předmět " + courseCode)

    return false // prevents default form submission behavior (refreshing the page)
}

function addGroup(group) {
    if (group.length == 0) {
        return
    }
    var type = group[0].type
    var name = group[0].name
    var id = type + ";" + name

    if (courses[id] === undefined) {
        courses[id] = {
            id: id,
            name: name + " (" + ((type==='P') ? "přednáška" : "seminář") + ")",
            options: [],
            allowed: true,
        }
    }
    group.allowed = true
    // We remember the index so that we can get back to this group when passing a filtered version
    // of options to the solver
    group.optionId = courses[id].options.length
    courses[id].options.push(group)
}

// Called when the "sestavit rozvrh" button is pressed
export function createSchedule() {
    view.setStatusMessage("Sestavuji rozvrh")

    var queryArray =
        Object.values(courses).filter(function(c) {
            return c.allowed && c.options.some(function(o){return o.allowed})}
        ).map(function(c) {
            return {
                id: c.id,
                name: c.name,
                reward: REWARDS[(c.priority || 2) - 1],
                options: c.options.filter(function(o) {
                    return o.allowed
                })
            }
        })

    backendQuery.createSchedule(queryArray, function(res, err) {
        if (err) {
            view.setStatusMessage("Chyba: " + err)
        } else {
            var nSelected = res.filter(function(x){return x !== null}).length
            view.setStatusMessage("Rozvrh sestaven (počet předmětů: " + nSelected + ")")
            for (var course in courses) {
                delete selectedOptions[course]
            }
            for (var i = 0; i < queryArray.length; i++) {
                if (res[i] !== null) { // if null, the course is not selected
                    selectedOptions[queryArray[i].id] = queryArray[i].options[res[i]].optionId
                }
            }
            view.renderCourseList(courses)
            view.renderSchedule(getNonOverlappingGroups())
        }
    })

    return false // prevents default form submission behavior (refreshing the page)
}


export function handleCheckbox(checkboxId, courseId, index) {
    if (index === undefined) { // Checkbox for the whole course
        // If something is checked, uncheck everything, otherwise check everything
        var checkAll = !courses[courseId].options.some(function(o) {return o.allowed})

        courses[courseId].options.forEach(function(o, i) {
            document.getElementById(checkboxId + "-" + i).checked = checkAll
            courses[courseId].options[i].allowed = checkAll
        })
        document.getElementById(checkboxId).checked = checkAll
    } else {
        courses[courseId].options[index].allowed = document.getElementById(checkboxId).checked
        document.getElementById(checkboxId.substring(0, checkboxId.length - 2)).checked = 
            courses[courseId].options.some(function(o) {return o.allowed})
    }
}

export function handlePriorityChange(courseId, priority) {
    courses[courseId].priority = priority
}

function getNonOverlappingGroups() {
    // For rendering purposes, we split the events into groups with no overlap.
    // Perhaps premature optimization, this is in case we want to allow the solver
    // to let some events overlap.
    var eventsByDay = [[],[],[],[],[]]

    for (var course in selectedOptions) {
        courses[course].options[selectedOptions[course]].forEach(function(event) {
            eventsByDay[event.day].push(event)
        }) 
    }

    return eventsByDay.map(function(eventsOfDay) {
        eventsOfDay.sort(function(a, b) {
            return util.timeToInt(a.time_from) - util.timeToInt(b.time_from)
        })
        var groups = []
        eventsOfDay.forEach(function(event) {
            var validGroup = null
            groups.forEach(function(group) {
                if (util.timeToInt(group[group.length - 1].time_to) <= util.timeToInt(event.time_from)) {
                    validGroup = group
                }
            })
            if (validGroup) {
                validGroup.push(event)
            } else {
                groups.push([event])
            }
        })
        return groups
    })
}
