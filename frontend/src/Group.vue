<template>
  
<tr :class="groupClass">
  <td>
    <input
      type="checkbox"
      v-model="allowed"
    >
  </td>
  <td>
    <label @click="allowed = !allowed">
      {{ group.terms[0].teacher }}
    </label>
  </td>
  <td>
    <label @click="allowed = !allowed">
      <template v-for="(term, index) in group.terms">
        {{ term.getTimeString() }}<br v-if="index < group.terms.length - 1">
      </template>
    </label>
  </td>
</tr>

</template>
<script>
  
export default {
  props: ['group', 'schedule'],
  computed: {
    groupClass () {
      for (let i = 0; i < this.schedule.length; i++) {
        if (this.schedule[i].group === this.group) {
          return 'selected_course'
        }
      }
      return ''
    },
    'allowed': {
      get () {
        if (!this.group.course.allowed)
          return false
        return this.group.allowed
      },
      set (value) {
        this.group.allowed = value
        if (value)
          this.group.course.allowed = true
        this.$emit('allowedItemsChanged')
      }
    }
  }
}

</script>
