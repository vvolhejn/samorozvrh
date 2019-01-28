/**
 * Represents a single term of a group.
 * Most groups have only a single term, but not all do.
 */
export default class Term {
  constructor (group, teacher, day, timeFrom, timeTo, weekParity) {
    /**
     * Group this term belongs to
     */
    this.group = group

    /**
     * Teacher name
     * @type {string}
     */
    this.teacher = teacher

    /**
     * Day index and times
     */
    this.day = day
    this.timeFrom = timeFrom
    this.timeTo = timeTo

    /**
     * 1 == odd weeks
     * 2 == even weeks
     */
    this.weekParity = weekParity
  }

  /**
   * Creates a Term instance from data sent by the server
   */
  static fromData (group, data) {
    return new Term(
      group,
      data.teacher,
      data.day,
      data.time_from,
      data.time_to,
      data.week_parity
    )
  }

  /**
   * Returns a string describing time of the term
   */
  getTimeString () {
    var s = ['Po', 'Út', 'St', 'Čt', 'Pá'][this.day]
    s += ' ' + this.timeFrom + '–' + this.timeTo
    if (this.weekParity === 1) {
      s += ' (liché týdny)'
    } else if (this.weekParity === 2) {
      s += ' (sudé týdny)'
    }
    return s
  }

  serializeForBackendQuery () {
    return {
      name: this.group.course.name,
      type: this.group.course.type,

      teacher: this.teacher,
      day: this.day,
      time_from: this.timeFrom,
      time_to: this.timeTo,
      week_parity: this.weekParity
    }
  }

  toJson () {
    return {
      teacher: this.teacher,
      day: this.day,
      timeFrom: this.timeFrom,
      timeTo: this.timeTo,
      weekParity: this.weekParity
    }
  }

  static fromJson (group, json) {
    return new Term(
      group,
      json.teacher,
      json.day,
      json.timeFrom,
      json.timeTo,
      json.weekParity
    )
  }
}
