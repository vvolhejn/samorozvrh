import Group from './Group.js'

/**
 * Represents a single course
 * e.g. Algoritmy a Datové struktury II (přednáška)
 *
 * Has many groups. A student can enroll to only a single group.
 */
export default class Course {
  constructor (code, type, name) {
    /**
     * Course id used for list rendering and other id stuff.
     * It is a unique identifier of the course.
     */
    this.id = type + ';' + code

    /**
     * Identifier of the course, eg. NTIN061
     * Not completely unique! Unique is the code, paired with type.
     * @type {string}
     */
    this.code = code

    /**
     * Type of the course (lecture/practicals)
     */
    this.type = type

    /**
     * Name of the course (human-readable, in Czech)
     */
    this.name = name

    /**
     * A list of course groups
     */
    this.groups = []

    /**
     * Course priority with possible values: {1, 2, 3}
     */
    this.priority = 2
  }

  /**
   * Is this course allowed to be considered during schedule creation?
   */
  get allowed() {
    for (const group of this.groups)
      if (group.allowed)
        return true
    return false
  }

  set allowed(value) {
    for (const group of this.groups)
      group.allowed = value
  }

  /**
   * Returns human-readable name of the course type
   */
  getTypeName() {
    switch (this.type) {
      case 'P': return 'přednáška'
      case 'X': return 'seminář'
      default:  return 'jiné'
    }
  }

  /**
   * Creates the server query for creating the schedule
   */
  static createScheduleQuery(courses) {
    const REWARDS = [1, 100, 10000]

    let query = []
    
    // maps sent data to application data
    let queryMap = []

    // courses actually sent to the server
    let sentCourses = courses.filter(c => c.allowed && c.groups.some(g => g.allowed))

    for (let i = 0; i < sentCourses.length; i++) {
      let course = sentCourses[i]
      let sentGroups = course.groups.filter(g => g.allowed)

      query.push({
        id: course.type + ";" + course.name, // TODO: does the server need this argument?
        name: course.name,
        reward: REWARDS[(course.priority || 2) - 1],
        options: sentGroups.map(g => g.serializeForQuery())
      })

      queryMap.push({
        course: course,
        sentGroups: sentGroups
      })
    }

    return [query, queryMap]
  }

  toJson () {
    return {
      code: this.code,
      type: this.type,
      name: this.name,
      groups: this.groups.map(g => g.toJson()),
      allowed: this.allowed,
      priority: this.priority
    }
  }

  static fromJson (json) {
    let course = new Course(json.code, json.type, json.name)
    course.groups = json.groups.map(g => Group.fromJson(course, g))
    course.allowed = json.allowed
    course.priority = json.priority
    return course
  }
}
