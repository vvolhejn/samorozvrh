<template>

<div id="courses">
  <table id="course_table">
    <thead></thead>    
    <course
      v-for="course in courses" :key="course.id"
      :course="course"
      :schedule="schedule"
      @allowedItemsChanged="$emit('allowedItemsChanged')"
    />
  </table>
</div>

</template>
<script>
  
import CourseComponent from './Course.vue'

export default {
  props: ['courses', 'schedule'],
  components: {
    'course': CourseComponent
  }
}

</script>