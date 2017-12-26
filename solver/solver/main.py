import json
import logging
import argparse

import course
from output import schedule_to_string
import solver


def main():
    logging.basicConfig(level=logging.INFO)
    parser = argparse.ArgumentParser()
    parser.add_argument("file")
    args = parser.parse_args()

    courses_json = json.load(open(args.file))
    courses = course.load_course_array(courses_json)

    for selection in solver.solve(courses):
        events = []
        for c, opt_index in zip(courses, selection):
            events.extend(c.options[opt_index])

        print(schedule_to_string(events))

if __name__ == '__main__':
    main()
