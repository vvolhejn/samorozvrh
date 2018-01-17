"use strict"

var courses = {}
var loadedCourseCodes = {}
var selectedOptions = {}
var courseListTemplate, scheduleTemplate

function addCourse() {
    var courseCode = document.getElementById("course_code").value
    if (loadedCourseCodes[courseCode]) {
        setStatusMessage("Předmět " + courseCode + " už je přidán")
        return false
    }
    var callback = function(responseString, error) {
        if (error) {
            setStatusMessage("Nastala chyba: " + error)
            return
        }
        if (!responseString) {
            setStatusMessage("Nastala chyba: Server neodpovídá.")
            return
        }
        var response = JSON.parse(responseString)
        if (response['error']) {
            setStatusMessage("Nepodařilo se najít předmět " + courseCode + "; je kód zadán správně?")
            return
        }
        addGroups(response['data'])
        updateCourses()
        loadedCourseCodes[courseCode] = true
        setStatusMessage("Přidán předmět " + courseCode)
    }
    setStatusMessage("Hledám předmět " + courseCode)
    makeHttpRequest("GET", "sisquery/" + encodeURIComponent(courseCode), null, callback)
    return false // prevents default form submission behavior (refreshing the page)
}



function makeHttpRequest(method, url, body, callback) {
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

function addGroups(data) {
    for (var i = 0; i < data.length; i++) {
        addGroup(data[i])
    }
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
            options: []
        }
    }
    courses[id].options.push(group)
}

function updateCourses() {
    var names = []
    for (var courseId in courses) {
        names.push([courses[courseId].name, courses[courseId]])
    }
    names.sort()

    var tbody = document.getElementById("course_table_body")
    tbody.innerHTML = courseListTemplate(names)
}

function createSchedule() {
    var queryArray = Object.values(courses)
    
    var callback = function(responseString, error) {
        if (error) {
            setStatusMessage("Nastala chyba: " + error)
            return
        }
        if (!responseString) {
            setStatusMessage("Nastala chyba: Server neodpovídá.")
            return
        }
        var response = JSON.parse(responseString)
        if (response['error']) {
            setStatusMessage("Chyba při tvorbě rozvrhu: " + response['error'])
            return
        }
        setStatusMessage("Rozvrh sestaven: " + response["data"])
        for (var i = 0; i < queryArray.length; i++) {
            selectedOptions[queryArray[i].id] = response["data"][i]
        }
        updateCourses()
        renderSchedule()
    }

    makeHttpRequest("POST", "solverquery/", JSON.stringify(queryArray), callback)
    return false
}

function getNonOverlappingGroups() {
    // For rendering purposes, we split the events into groups with no overlap.
    var eventsByDay = [[],[],[],[],[]]
    for (var course in selectedOptions) {
        console.log(courses[course].options[selectedOptions[course]])
        courses[course].options[selectedOptions[course]].forEach(function(event) {
            eventsByDay[event.day].push(event)
        }) 
    }

    return eventsByDay.map(function(eventsOfDay) {
        eventsOfDay.sort(function(a, b) {
            return timeToInt(a.time_from) - timeToInt(b.time_from)
        })
        var groups = []
        eventsOfDay.forEach(function(event) {
            var validGroup = null
            groups.forEach(function(group) {
                if (timeToInt(group[group.length - 1].time_to) <= timeToInt(event.time_from)) {
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

function renderSchedule() {
    var groupsByDay = getNonOverlappingGroups().map(function(g, i) {
        return {
            day: ["Pondělí","Úterý","Středa","Čtvrtek","Pátek"][i],
            groups: g
        }
    })
    var data = {
        timestamps: ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00"],
        groupsByDay: groupsByDay,
    }

    var schedule = document.getElementById("schedule")
    schedule.innerHTML = scheduleTemplate(data)
}

function setStatusMessage(s) {
    document.getElementById("status").innerHTML = s
}

function getTimeString(e) {
    var s = ["Po", "Út", "St", "Čt", "Pá"][e.day]
    s += " " + e.time_from + "–" + e.time_to
    if (e.week_parity == 1) {
        s += " (liché týdny)"
    } else if (e.week_parity == 2) {
        s += " (sudé týdny)"
    }
    return s
}

function timeToInt(s) {
    // Parses times in the format 09:15
    return parseInt(s.substring(0,2)) * 60 + parseInt(s.substring(3,5))
}

function initHandlebars() {
    Handlebars.registerHelper('all_times', function() {
        return new Handlebars.SafeString(
            this.map(getTimeString).join("; ")
        );
    });

    var timeToRatio = function(time) {
        var mint = timeToInt("07:00")
        var maxt = timeToInt("20:00")
        var ratio = Math.min(1, Math.max(0,(time-mint)/(maxt-mint)))
        return ratio
    }

    Handlebars.registerHelper('event_style', function() {
        var fc = timeToRatio(timeToInt(this.time_from))
        var tc = timeToRatio(timeToInt(this.time_to))
        var formatPercent = function(x) {
            return (x*100)+"%"
        }
        return  "left: "  + formatPercent(fc) + 
                ";width: "+ formatPercent(tc - fc) + ";"
    });

    Handlebars.registerHelper('time_to_percent', function(timeString) {
        return (timeToRatio(timeToInt(timeString))*100)+"%"
    });

    var source = document.getElementById("course_list_template").innerHTML;
    courseListTemplate = Handlebars.compile(source);
    
    source = document.getElementById("schedule_template").innerHTML;
    scheduleTemplate = Handlebars.compile(source);
}

initHandlebars();
