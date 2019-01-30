/**
 * Represents a single term of a group.
 * Most groups have only a single term, but not all do.
 */

export default class Term {
  constructor (group, teacher, room, building, language,
    day, timeFrom, timeTo, weekParity) {
    this.group = group
    this.teacher = teacher
    /** Room, often a code such as "S4" */
    this.room = room
    /** Address of the room's building */
    this.building = building
    /** typically 'čeština' or 'angličtina' */
    this.language = language
    /** Day index from 0 to 4 */
    this.day = day
    this.timeFrom = timeFrom
    this.timeTo = timeTo

    /**
     * 0 == every week
     * 1 == odd weeks
     * 2 == even weeks
     */
    this.weekParity = weekParity
  }

  /**
   * Returns a string describing the time of the term
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
      building: this.building,
      language: this.language,
      day: this.day,
      time_from: this.timeFrom,
      time_to: this.timeTo,
      week_parity: this.weekParity,
    }
  }

  toJson () {
    return {
      teacher: this.teacher,
      room: this.room,
      building: this.building,
      language: this.language,
      day: this.day,
      time_from: this.timeFrom,
      time_to: this.timeTo,
      week_parity: this.weekParity,
    }
  }

  static fromJson (group, json) {
    return new Term(
      group,
      json.teacher,
      json.room,
      json.building,
      json.language,
      json.day,
      json.time_from,
      json.time_to,
      json.week_parity,
    )
  }
}
