var courses = {}
var loadedCourseCodes = {}

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
        response = JSON.parse(responseString)
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
        names.push([courses[courseId].name, courseId])
    }
    names.sort()

    var tbody = document.createElement('tbody');
    tbody.id = 'course_table_body'

    names.forEach(function(name){
        var row = tbody.insertRow(-1)
        row.setAttribute("colspan", "2")
        row.setAttribute("class", "course_header")
        row.insertCell(-1).innerText = name[0]

        courses[name[1]].options.forEach(function(option) {
            var row = tbody.insertRow(-1)
            row.insertCell(-1).innerText = option[0].teacher
            times = option.map(getTimeString).join("; ")
            row.insertCell(-1).innerText = times

        })
    })

    var oldTbody = document.getElementById("course_table_body")
    oldTbody.parentNode.replaceChild(tbody, oldTbody)
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

function createSchedule() {
    console.log(JSON.stringify(Object.values(courses)))
    //makeHttpRequest("POST", "schedulequery", JSON.stringify(courses), callback)
    return false
}
