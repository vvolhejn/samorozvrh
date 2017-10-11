import calendar

from ortools.constraint_solver import pywrapcp
# Refer to https://github.com/google/or-tools/issues/62


def solve(courses):
    """
    Given a list of courses to enroll in (a course may have multiple alternative times),
    find a valid schedule.
    """
    # main2()
    solver = pywrapcp.Solver("autorozvrh")

    print("----------")
    flat_vars = []
    flat_vars_inverse = []

    for course_index, course in enumerate(courses):
        course_vars = create_course_variables(solver, course)
        flat_vars.extend([v for v, _ in course_vars])
        flat_vars_inverse.extend([(course_index, alt_index) for _, alt_index in course_vars])

    # all_course_vars = [create_course_variables(solver, course) for course in courses]
    sequences_for_day = create_disjunctive_constraints(solver, flat_vars)

    # flat_vars = []
    # for course_vars in all_course_vars:
    #     flat_vars.extend([event for alternative in course_vars for event in alternative])

    collector = solver.AllSolutionCollector()
    # collector.Add(sequence)
    collector.Add(flat_vars)
    sequencePhase = solver.Phase(sequences_for_day, solver.SEQUENCE_DEFAULT)
    intervalPhase = solver.Phase(flat_vars, solver.INTERVAL_DEFAULT)
    mainPhase = solver.Compose([sequencePhase,
                                intervalPhase])

    ok = solver.Solve(mainPhase, [collector])

    if not ok:
        print("No solution found or some other error occurred.")
        return

    print(collector.SolutionCount())
    res = None
    for i in range(collector.SolutionCount()):
        print("Solution ", i)
        selection = [None] * len(courses)

        for j in range(len(flat_vars)):
            if collector.PerformedValue(i, flat_vars[j]):
                course_index, alt_index = flat_vars_inverse[j]

                if selection[course_index] and selection[course_index] != alt_index:
                    raise RuntimeError("Multiple alternatives were chosen for"
                                       "course {} ".format(course_index))

                selection[course_index] = alt_index

        res = selection

        for j in range(len(flat_vars)):
            if collector.PerformedValue(i, flat_vars[j]):
                print("{} {} | ".format(collector.PerformedValue(i, flat_vars[j]),
                                        collector.StartValue(i, flat_vars[j])),
                      end="")
            else:
                print("{} - | ".format(collector.PerformedValue(i, flat_vars[j])),
                      end="")
            print(flat_vars[j].Name() + " ", end="")
            print()

        print()

    return res


def create_course_variables(solver, course):
    variables = []
    representatives = []

    for alt_index, alt in enumerate(course.alternatives):

        if not alt:
            raise ValueError("Each alternative should contain at least one event.")

        alt_variables = []
        for event in alt:
            var = solver.FixedDurationIntervalVar(
                time_to_int(event.time_from),  # Minimum start time
                time_to_int(event.time_from),  # Maximum start time
                time_to_int(event.time_to) - time_to_int(event.time_from),  # Duration
                True,  # Is the interval optional?
                "{} - {}".format(course.name, event.name)
            )
            # Sneak in our properties
            var.day = event.day
            var.alternative_index = alt_index

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
    Create constrains that forbids multiple events from taking place at the same time
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
