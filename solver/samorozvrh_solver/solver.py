import calendar
import logging

from ortools.constraint_solver import pywrapcp
# Refer to https://github.com/google/or-tools/issues/62

logger = logging.getLogger(__name__)


def solve(courses, time_limit_ms):
    """
    Given a list of courses to enroll in (a course may have multiple alternative times),
    find a valid schedule.
    """
    solver = pywrapcp.Solver('autorozvrh')

    flat_vars = []
    flat_vars_inverse = []
    reward_exprs = []  # The solver tries to maximize the sum of the expressions in this array

    for course_index, course in enumerate(courses):
        course_vars, reward_expr = create_course_variables(solver, course)
        reward_exprs.append(reward_expr)
        flat_vars.extend([v for v, _ in course_vars])
        flat_vars_inverse.extend([(course_index, opt_index) for _, opt_index in course_vars])

    sequences_for_day = create_disjunctive_constraints(solver, flat_vars)

    # Note: Use AllSolutionCollector to see all solutions rather than the best
    collector = solver.BestValueSolutionCollector(True)  # True means to choose the maximum, not minimum
    collector.Add(flat_vars)  # Make the collector remember the variables' values in solutions

    obj_var = solver.Sum(reward_exprs)
    collector.AddObjective(obj_var)  # Make the collector remember the objective value
    objective_monitor = solver.Maximize(obj_var, 1)  # To make the solver care about the objective

    sequence_phase = solver.Phase(sequences_for_day, solver.SEQUENCE_DEFAULT)
    interval_phase = solver.Phase(flat_vars, solver.INTERVAL_DEFAULT)
    minimize_phase = solver.Phase([obj_var],
                                  solver.CHOOSE_FIRST_UNBOUND,
                                  solver.ASSIGN_MIN_VALUE)

    # It seems that both interval_phase and minimize_phase can be omitted?
    main_phase = solver.Compose([sequence_phase,
                                 interval_phase,
                                 minimize_phase])

    # Stop the solver after a fixed time / number of found solutions
    # solutions_limit = solver.SolutionsLimit(SOLUTIONS_LIMIT)
    ok = solver.Solve(
        main_phase,
        [
            solver.TimeLimit(time_limit_ms),
            # solutions_limit,
            objective_monitor,
            collector,
        ])

    logger.info('Time: {} ms'.format(solver.WallTime()))
    if not ok:
        logger.warning('No solution was found or an error occurred in the solver.')
        return

    logger.info('Number of solutions: {}'.format(collector.SolutionCount()))

    for solution_index in range(collector.SolutionCount()):
        logger.info('Solution {} (reward {})'.format(solution_index,
                                                     collector.ObjectiveValue(solution_index)))
        yield _solution_to_selection(collector, solution_index,
                                     flat_vars, flat_vars_inverse, len(courses))


def _solution_to_selection(collector, solution_index, flat_vars, flat_vars_inverse, n_courses):
    """
    Given a solution found by the solver, extract the list of indices of selected options.
    Specifically, if selection[i]=j, the j-th option of the i-th course was selected,
    selection[i]=None if the course was not selected.
    """
    selection = [None] * n_courses

    for j in range(len(flat_vars)):
        if collector.PerformedValue(solution_index, flat_vars[j]):
            course_index, opt_index = flat_vars_inverse[j]
            if (selection[course_index] is not None) and (selection[course_index] != opt_index):
                raise RuntimeError('Multiple options were chosen for '
                                   'course {} '.format(course_index))

            selection[course_index] = opt_index

    return selection


def create_course_variables(solver, course):
    """
    Given a course, returns a pair of:
    - a (flat) list of variables corresponding to the course's events.
    - an expression representing the reward for the course (course.reward if selected, 0 if not)
    Appropriate constraints are added to make the solver pick exactly one option.
    """
    variables = []
    representatives = []

    for opt_index, opt in enumerate(course.options):

        if not opt:
            raise ValueError('Each option should contain at least one event.')

        opt_variables = []
        for event in opt:
            # We fix the event's time but allow it to be optional
            var = solver.FixedDurationIntervalVar(
                time_to_int(event.time_from),  # Minimum start time
                time_to_int(event.time_from),  # Maximum start time
                time_to_int(event.time_to) - time_to_int(event.time_from),  # Duration
                True,  # Is the interval optional?
                '{} - {}'.format(course.name, event.name)
            )
            var.day = event.day  # This is our custom property

            opt_variables.append(var)

        # Pick all or nothing from this option
        for variable in opt_variables[1:]:
            solver.Add(opt_variables[0].PerformedExpr() == variable.PerformedExpr())

        variables.extend([(v, opt_index) for v in opt_variables])
        # One variable from each option
        representatives.append(opt_variables[0])

    # Pick at most one option (exactly one: SumEquality)
    solver.Add(solver.SumLessOrEqual([r.PerformedExpr() for r in representatives], 1))

    return variables, course.reward * solver.Sum([r.PerformedExpr() for r in representatives])


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
            # 'operations_research::Solver::MakeMax() was called with an empty list of variables.'
            continue

        disj = solver.DisjunctiveConstraint(day, calendar.day_abbr[day_num])
        solver.Add(disj)
        sequences_for_day.append(disj.SequenceVar())

    return sequences_for_day


def time_to_int(t):
    return t.hour * 60 + t.minute
