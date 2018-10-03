<template>

<div id="schedule">
  <table id="schedule_table" v-show="terms.length > 0">
    <tr>
      <td>&nbsp;</td>
      <td class="schedule_group">
        <div
          v-for="time in timestamps"
          class="schedule_timestamp"
          :style="{ 'left': timeToPercent(time) }"
        >{{ time }}</div>
      </td>
    </tr>

    <template v-for="(day, dayIndex) in days">
      <tr v-for="(row, rowIndex) in termsByDay[dayIndex].rows">
        <td>
          {{ rowIndex === 0 ? day : '' }}
          <br>&nbsp;
        </td>
        <td class="schedule_group">
          <div
            v-for="term in row"
            class="schedule_event"
            :style="termStyle(term)"
          >
            <div class="schedule_event_inner">
              {{ term.group.course.name }}<br>
              {{ term.teacher }}
            </div>
          </div>
        </td>
      </tr>
    </template>

  </table>
</div>

</template>
<script>

const util = require('./util')

export default {
  props: ['terms'],
  computed: {
    
    /**
     * Timestamps for the time-axis
     */
    timestamps () {
      return [
        '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
        '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
      ]
    },

    /**
     * Days for the day-of-week-axis
     */
    days () {
      return ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek']
    },

    /**
     * Terms grouped by day of week
     * days -> rows -> terms (rows for overlapping)
     */
    termsByDay () {
      let days = []
      for (let i = 0; i < this.days.length; i++) {
        days.push({
          rows: [
            [] // at least one row of terms is always present
          ]
        })
      }

      // helper function
      let timeInInterval = (subject, start, end) => {
        return util.timeToInt(subject) >= util.timeToInt(start)
          && util.timeToInt(subject) <= util.timeToInt(end)
      }

      // helper function
      let canFitIntoRow = (row, term) => {
        for (let i = 0; i < row.length; i++) {
          if (timeInInterval(term.timeFrom, row[i].timeFrom, row[i].timeTo))
            return false
          if (timeInInterval(term.timeTo, row[i].timeFrom, row[i].timeTo))
            return false
        }
        return true
      }

      // add terms one by one
      for (let i = 0; i < this.terms.length; i++) {
        let term = this.terms[i]
        let day = days[term.day]

        // find first available row or create new one
        let row = day.rows.find(row => canFitIntoRow(row, term))
        if (!row) {
          row = []
          day.rows.push(row)
        }

        // put the term into the row
        row.push(term)
      }

      return days
    }

  },
  methods: {

    /**
     * Converts time string to position percentage
     */
    timeToPercent (timeString) {
      return (util.timeToRatio(util.timeToInt(timeString)) * 100) + '%'
    },

    /**
     * Computes style for a given term
     */
    termStyle (term) {
      var fc = util.timeToRatio(util.timeToInt(term.timeFrom))
      var tc = util.timeToRatio(util.timeToInt(term.timeTo))
      var formatPercent = x => (x * 100) + '%'
      return {
        'left': formatPercent(fc),
        'width': formatPercent(tc - fc)
      }
    }

  }
}

</script>