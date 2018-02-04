import json
import logging
import argparse

import course
from output import schedule_to_string
import solver


def main():
    parser = argparse.ArgumentParser(description=(
        "Samorozvrh solver - given a JSON file containing course data, "
        "computes a schedule to maximize weighted sum of selected courses."))
    parser.add_argument("file")
    parser.add_argument("--debug", action="store_true")
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO if args.debug else logging.WARN)

    courses_json = json.load(open(args.file))
    courses = course.load_course_array(courses_json)
    logging.info("Solving...")

    for selection in solver.solve(courses):
        events = []
        for c, opt_index in zip(courses, selection):
            if opt_index != None:
                events.extend(c.options[opt_index])

        logging.info(schedule_to_string(events))

        print(json.dumps({"data": selection}))

        if not args.debug:
            # Print all solutions in debug mode, just one normally
            return

if __name__ == '__main__':
    main()
