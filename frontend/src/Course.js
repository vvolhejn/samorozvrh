import Group from './Group.js'

/**
 * Represents a single course
 * e.g. Algoritmy a Datové struktury II (přednáška)
 *
 * Has many groups. A student can enroll to only a single group.
 */
export default class Course {
  constructor (type, name) {
    /**
     * Course id used for list rendering and other id stuff
     */
    this.id = type + ';' + name

    /**
     * Type of the course (lecture/practicals)
     */
    this.type = type

    /**
     * Name of the course (human-readable, in czech)
     */
    this.name = name

    /**
     * A list of course groups
     */
    this.groups = []

    /**
     * Is this course allowed to be considered during schedule creation?
     */
    this.allowed = true

    /**
     * Priority of this course
     */
    this.priority = 2
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

    // the query sent to the server
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

  /**
   * Serializes object to JSON
   */
  toJson () {
    return {
      type: this.type,
      name: this.name,
      groups: this.groups.map(g => g.toJson()),
      allowed: this.allowed,
      priority: this.priority
    }
  }

  /**
   * Creates the object from it's JSON representation
   */
  static fromJson (json) {
    let course = new Course(json.type, json.name)
    course.groups = json.groups.map(g => Group.fromJson(course, g))
    course.allowed = json.allowed
    course.priority = json.priority
    return course
  }
}
