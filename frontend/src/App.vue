<template>

<div>
  <div id="left">
    <h1>Samorozvrh</h1>
    <div>
      <a href="about.html"><em>O co jde?</em></a><br>
      Kód předmětu nebo <a href="about.html"><em>speciální kód</em></a>:<br>
      <input
        ref="courseCodeField"
        type="text"
        name="course_code"
        id="course_code"
        onfocus="this.select()"
        v-model="courseCodeFieldValue"
      >
      <button @click="addCourse(courseCodeFieldValue)">
        Přidat
      </button>
    </div>
    <div>
      <button @click="createSchedule()">
        Sestavit rozvrh
      </button>
    </div>
    <div>
      <button @click="clearAll()">
        Smazat vše
      </button>
    </div>
    <div id="status">{{ statusMessage }}</div>
    <hr>
    <schedule :terms="schedule"/>
  </div>

  <div id="right">
    <course-list
      :courses="courses"
      :schedule="schedule"
      @allowedItemsChanged="storeAppState"
    />
  </div>
</div>

</template>
<script>

var backendQuery = require('./backendQuery')
import Course from './Course.js'
import Group from './Group.js'
import CourseList from './CourseList.vue'
import Schedule from './Schedule.vue'

const STORAGE_KEY = "samorozvrh-state"

export default {
  data () { return {

    /**
     * Value of the "add course" text field
     */
    courseCodeFieldValue: 'NTIN061',

    /**
     * Message displayed in the status bar
     */
    statusMessage: '',

    ////////////////////
    // Main app state //
    ////////////////////

    /**
     * All user-selected courses
     */
    courses: [],

    /**
     * Already loaded course codes to prevent double-loading
     */
    loadedCourseCodes: new Set(),

    /**
     * List of terms of groups in the schedule
     */
    schedule: []
  }},

  /**
   * When the component is mounted to the DOM
   */
  mounted () {
    this.restoreAppState()

    // focus course code field
    this.$refs.courseCodeField.focus()
  },

  methods: {

    /**
     * Adds course with the given code to the user selection
     */
    addCourse (courseCode) {
      if (this.loadedCourseCodes.has(courseCode)) {
        this.setStatusMessage(`Předmět ${courseCode} už je přidán`)
        return
      }

      this.setStatusMessage(`Hledám předmět ${courseCode}`)
      
      backendQuery.addCourse(courseCode, (res, err) => {
        if (err) {
          this.setStatusMessage(`Chyba: ${err}`)
          return
        }

        for (let i = 0; i < res.length; i++)
          this.addGroup(courseCode, res[i], i)

        this.loadedCourseCodes.add(courseCode)
        this.storeAppState()
        this.setStatusMessage(`Přidán předmět ${courseCode}`)
      })
    },

    /**
     * Adds a group to the list of courses
     * (course is found or created automatically)
     */
    addGroup (courseCode, groupData, index) {
      // get the course
      let type = groupData[0].type
      let course = this.courses.find(
        x => x.code == courseCode && x.type == type
      )

      // create course if needed
      if (!course) {
        course = new Course(courseCode, type, groupData[0].name)
        this.courses.push(course)
      }

      // add the group
      course.groups.push(Group.fromData(course, index, groupData))
    },

    /**
     * Sends courses to server and creates a schedule from response
     */
    createSchedule () {
      this.setStatusMessage('Sestavuji rozvrh')

      let [query, queryMap] = backendQuery.createScheduleQuery(this.courses)

      backendQuery.createSchedule(query, (res, err) => {
        if (err) {
          this.setStatusMessage(`Chyba: ${err}`)
          return
        }
        
        var nSelected = res.filter(x => x !== null).length
        this.setStatusMessage(`Rozvrh sestaven (počet předmětů: ${nSelected})`)
        
        // create the schedule
        this.schedule = []
        for (let i = 0; i < res.length; i++) {
          if (res[i] !== null) {
            this.schedule.splice( // append terms to schedule
              this.schedule.length,
              0,
              ...queryMap[i].sentGroups[res[i]].terms
            )
          }
        }
      })
    },

    /**
     * Clears the application state
     */
    clearAll () {
      if (!window.confirm('Opravdu smazat vše?')) {
        return
      }

      this.courses = []
      this.loadedCourseCodes = new Set()
      this.schedule = []
      this.storeAppState()
      this.setStatusMessage('')
    },

    /**
     * Sets the text displayed in the status bar
     */
    setStatusMessage (message) {
      this.statusMessage = message
    },

    ///////////////////////
    // State persistence //
    ///////////////////////

    /**
     * Stores the application state into the browser
     */
    storeAppState () {
      if (!(window.localStorage instanceof Storage)) {
        return
      }

      let state = {
        courses: this.courses.map(c => c.toJson()),
        loadedCourseCodes: [...this.loadedCourseCodes]
      }

      window.localStorage[STORAGE_KEY] = JSON.stringify(state)
    },

    /**
     * Restores the app state from the browser
     */
    restoreAppState () {
      if (!(window.localStorage instanceof Storage)) {
        return
      }

      let state

      try {
        state = JSON.parse(window.localStorage[STORAGE_KEY])
      } catch (e) {
        console.error(e)
        return
      }

      this.courses = state.courses.map(c => Course.fromJson(c))
      this.loadedCourseCodes = new Set(state.loadedCourseCodes)
    }

  },

  components: {
    'course-list': CourseList,
    'schedule': Schedule,
  }
}

</script>
