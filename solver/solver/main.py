import json

import course
import solver


def main():
    foo = json.load(open("fixtures/foo.json"))
    foo_course = course.load_course(foo)
    bar = json.load(open("fixtures/bar.json"))
    bar_course = course.load_course(bar)

    courses = [foo_course, bar_course]
    selection = solver.solve(courses)
    events = []
    for c, alt_index in zip(courses, selection):
        events.extend(c.alternatives[alt_index])

    course.print_schedule(events)

if __name__ == '__main__':
    main()
