var courses = {}
var loadedCourseCodes = {}

function handleForm() {
    var courseCode = document.getElementById("course_code").value
    if (loadedCourseCodes[courseCode]) {
        setStatusMessage("Předmět " + courseCode + " už je přidán")
        return false
    }
    makeSisRequest(courseCode, function(responseString, error) {
        if (error) {
            setStatusMessage("Nastala chyba: " + error)
            return
        }
        response = JSON.parse(responseString)
        if (response['error']) {
            setStatusMessage("Nepodařilo se najít předmět " + courseCode + "; je kód zadán správně?")
            return
        }
        addEvents(response['data'])
        updateCourses()
        loadedCourseCodes[courseCode] = true
        setStatusMessage("Přidán předmět " + courseCode)
    })
    return false // prevents default form submission behavior (refreshing the page)
}

function makeSisRequest(courseCode, callback) {
    var request = new XMLHttpRequest()
    request.onreadystatechange = function() {
        if (this.readyState == 4) {
            if (this.status == 200) {
                callback(request.responseText, null)
            } else {
                callback(null, request.responseText)
            }
        }
    };
    setStatusMessage("Hledám předmět " + courseCode)

    request.open("GET", "sisquery/" + encodeURIComponent(courseCode), true)
    request.send()
}

function addEvents(data) {
    for (var i = 0; i < data.length; i++) {
        addEvent(data[i])
    }
}

function addEvent(e) {
    var id = e.type + ";" + e.name
    if (courses[id] === undefined) {
        courses[id] = {
            name: e.name + " (" + ((e.type==='P') ? "přednáška" : "seminář") + ")",
            options: []
        }
    }
    courses[id].options.push(e)
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

function updateCourses() {
    var names = []
    for (var courseId in courses) {
        names.push([courses[courseId].name, courseId])
    }
    names.sort()

    var tbody = document.createElement('tbody');
    tbody.id = 'course_table_body'

    for (var i = 0; i < names.length; i++) {
        var row = tbody.insertRow(-1)
        row.setAttribute("colspan", "2")
        row.setAttribute("class", "course_header")
        row.insertCell(-1).innerText = names[i][0]

        var options = courses[names[i][1]].options
        for (var j = 0; j < options.length; j++) {
            var row = tbody.insertRow(-1)
            row.insertCell(-1).innerText = options[j].teacher
            row.insertCell(-1).innerText = getTimeString(options[j])
        }
        tbody.appendChild(row)
    }

    var oldTbody = document.getElementById("course_table_body")
    oldTbody.parentNode.replaceChild(tbody, oldTbody)
}

function setStatusMessage(s) {
    document.getElementById("status").innerHTML = s
}
