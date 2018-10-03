import Term from './Term.js'

/**
 * Represents a group (parallel) a student can enroll into (czech: ~paralelka)
 */
export default class Group {
  constructor (course) {
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

  /**
   * Creates a Group instance from data sent by the server
   */
  static fromData (course, data) {
    let group = new Group(course)
    data.forEach(d => group.terms.push(Term.fromData(group, d)))
    return group
  }

  /**
   * Serializes the group for create schedule query
   */
  serializeForQuery () {
    return this.terms.map(term => term.serializeForQuery())
  }

  /**
   * Serializes object to JSON
   */
  toJson () {
    return {
      terms: this.terms.map(t => t.toJson()),
      allowed: this.allowed
    }
  }

  /**
   * Creates the object from it's JSON representation
   */
  static fromJson (course, json) {
    let group = new Group(course)
    group.terms = json.terms.map(t => Term.fromJson(group, t))
    group.allowed = json.allowed
    return group
  }
}
