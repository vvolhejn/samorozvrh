import json
import logging
import argparse

from samorozvrh_solver import course
from samorozvrh_solver.output import schedule_to_string
from samorozvrh_solver import solver


def main():
    parser = argparse.ArgumentParser(description=(
        "Samorozvrh solver - given a JSON file containing course data, "
        "computes a schedule to maximize weighted sum of selected courses."))
    parser.add_argument("file")
    parser.add_argument("--debug", action="store_true")
    parser.add_argument("--time-limit",
                        type=int,
                        default=1000,
                        help="At most how much time to spend on solving")
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO if args.debug else logging.WARN)

    courses_json = json.load(open(args.file))
    courses = course.load_course_array(courses_json)
    logging.info("Solving...")

    for selection in solver.solve(courses, args.time_limit):
        events = []
        for c, opt_index in zip(courses, selection):
            if opt_index is not None:
                events.extend(c.options[opt_index])

        logging.info(schedule_to_string(events))

        print(json.dumps({"data": selection}))

        if not args.debug:
            # Print all solutions in debug mode, just one normally
            return


if __name__ == '__main__':
    main()
