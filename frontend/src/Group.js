import Term from './Term.js'

/**
 * Represents a group (parallel) a student can enroll into (czech: ~paralelka)
 */
export default class Group {
  constructor (course, index) {
    /**
     * Index of the group, as it has been sent by the server
     * Used to identify the group
     * Has no meaning outside frontend
     * @type {int}
     */
    this.index = index

    /**
     * Unique id of the group used for rendering purpouses
     * @type {string}
     */
    this.id = course.id + ';' + index

    /**
     * Course this group belongs to
     */
    this.course = course

    /**
     * List of terms this group takes time at
     */
    this.terms = []

    /**
     * Is this group allowed to be considered during schedule creation?
     */
    this.allowed = true
  }

  serializeForBackendQuery () {
    return this.terms.map(term => term.serializeForBackendQuery())
  }

  toJson () {
    return {
      index: this.index,
      terms: this.terms.map(t => t.toJson()),
      allowed: this.allowed,
    }
  }

  static fromJson (course, json) {
    let group = new Group(course, json.index)
    group.terms = json.terms.map(t => Term.fromJson(group, t))
    group.allowed = (typeof json.allowed === typeof true) ? json.allowed : true
    return group
  }
}
