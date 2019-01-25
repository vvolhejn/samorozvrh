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
      for (const term of this.schedule) {
        if (term.group === this.group) {
          return 'selected_course'
        }
      }
      return ''
    },
    'allowed': {
      get () {
        return this.group.allowed
      },
      set (value) {
        this.group.allowed = value
        this.$emit('allowedItemsChanged')
      }
    }
  }
}

</script>
