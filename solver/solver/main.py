import json
import logging

import course
from output import schedule_to_string
import solver


def main():
    logging.basicConfig(level=logging.INFO)

    foo = json.load(open("fixtures/foo.json"))
    foo_course = course.load_course(foo)
    bar = json.load(open("fixtures/bar.json"))
    bar_course = course.load_course(bar)

    courses = [foo_course, bar_course]
    for selection in solver.solve(courses):
        events = []
        for c, alt_index in zip(courses, selection):
            events.extend(c.alternatives[alt_index])

        print(schedule_to_string(events))

if __name__ == '__main__':
    main()
