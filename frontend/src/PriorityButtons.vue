<template>

<tr>
  <td colspan="2" class="pr_cell">
    Priorita:

    <input
      class="pr_radio"
      type="radio"
      :value="1"
      :name="radioGroup"
      :id="radioId(1)"
      v-model="course.priority"
    >
    <label :for="radioId(1)" class="pr_label1"></label>

    <input
      class="pr_radio"
      type="radio"
      :value="2"
      :name="radioGroup"
      :id="radioId(2)"
      v-model="course.priority"
    >
    <label :for="radioId(2)" class="pr_label2"></label>

    <input
      class="pr_radio"
      type="radio"
      :value="3"
      :name="radioGroup"
      :id="radioId(3)"
      v-model="course.priority"
    >
    <label :for="radioId(3)" class="pr_label3"></label>
  </td>
</tr>

</template>
<script>
  
/*
  Disclamer: This component is an insane bodge right now.
 */

let globalIndex = 0

export default {
  props: ['course'],
  data () { return {
    index: globalIndex++
  }},
  computed: {
    radioGroup () {
      return 'radiogroup' + this.index
    }
  },
  methods: {
    radioId(priority) {
      return 'radio' + priority + '' + this.index
    }
  }
}

</script>
