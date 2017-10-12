import calendar
import logging

from ortools.constraint_solver import pywrapcp
# Refer to https://github.com/google/or-tools/issues/62

logger = logging.getLogger(__name__)


def solve(courses):
    """
    Given a list of courses to enroll in (a course may have multiple alternative times),
    find a valid schedule.
    """
    solver = pywrapcp.Solver("autorozvrh")

    flat_vars = []
    flat_vars_inverse = []

    for course_index, course in enumerate(courses):
        course_vars = create_course_variables(solver, course)
        flat_vars.extend([v for v, _ in course_vars])
        flat_vars_inverse.extend([(course_index, alt_index) for _, alt_index in course_vars])

    sequences_for_day = create_disjunctive_constraints(solver, flat_vars)

    collector = solver.AllSolutionCollector()
    # This makes it so that we can query the collector for the variables' values
    collector.Add(flat_vars)

    sequence_phase = solver.Phase(sequences_for_day, solver.SEQUENCE_DEFAULT)
    interval_phase = solver.Phase(flat_vars, solver.INTERVAL_DEFAULT)
    main_phase = solver.Compose([sequence_phase,
                                 interval_phase])

    ok = solver.Solve(main_phase, [collector])
    if not ok:
        logger.warning("No solution was found or an error occurred.")
        return

    logger.info("Number of solutions: {}".format(collector.SolutionCount()))

    for solution_index in range(collector.SolutionCount()):
        logger.info("Solution {}".format(solution_index))
        yield _solution_to_selection(collector, solution_index,
                                     flat_vars, flat_vars_inverse, len(courses))


def _solution_to_selection(collector, solution_index, flat_vars, flat_vars_inverse, n_courses):
    selection = [None] * n_courses

    for j in range(len(flat_vars)):
        if collector.PerformedValue(solution_index, flat_vars[j]):
            course_index, alt_index = flat_vars_inverse[j]

            if selection[course_index] and selection[course_index] != alt_index:
                raise RuntimeError("Multiple alternatives were chosen for"
                                   "course {} ".format(course_index))

            selection[course_index] = alt_index

    return selection


def create_course_variables(solver, course):
    """
    Given a course, returns a (flat) list of variables corresponding to the course's events.
    Appropriate constraints are added to make the solver pick exactly one alternative.
    """
    variables = []
    representatives = []

    for alt_index, alt in enumerate(course.alternatives):

        if not alt:
            raise ValueError("Each alternative should contain at least one event.")

        alt_variables = []
        for event in alt:
            # We fix the event's time but allow it to be optional
            var = solver.FixedDurationIntervalVar(
                time_to_int(event.time_from),  # Minimum start time
                time_to_int(event.time_from),  # Maximum start time
                time_to_int(event.time_to) - time_to_int(event.time_from),  # Duration
                True,  # Is the interval optional?
                "{} - {}".format(course.name, event.name)
            )
            var.day = event.day  # This is our custom property

            alt_variables.append(var)

        # Pick all or nothing from this alternative
        for variable in alt_variables[1:]:
            solver.Add(alt_variables[0].PerformedExpr() == variable.PerformedExpr())

        variables.extend([(v, alt_index) for v in alt_variables])
        # One variable from each alternative
        representatives.append(alt_variables[0])

    # Pick exactly one alternative
    solver.Add(solver.SumEquality([r.PerformedExpr() for r in representatives], 1))

    return variables


def create_disjunctive_constraints(solver, flat_vars):
    """
    Create constrains that forbids multiple events from taking place at the same time.
    Returns a list of `SequenceVar`s, one for each day. These are then used in the first
    phase of the solver.
    """
    events_for_day = [[] for _ in range(5)]

    for v in flat_vars:
        events_for_day[v.day].append(v)

    sequences_for_day = []

    for day_num, day in enumerate(events_for_day):
        if not day:
            # For empty arrays, OR-tools complains:
            # "operations_research::Solver::MakeMax() was called with an empty list of variables."
            continue

        disj = solver.DisjunctiveConstraint(day, calendar.day_abbr[day_num])
        solver.Add(disj)
        sequences_for_day.append(disj.SequenceVar())

    return sequences_for_day


def time_to_int(t):
    return t.hour * 60 + t.minute
