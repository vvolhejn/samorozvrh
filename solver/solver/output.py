import calendar
from datetime import time, date, datetime, timedelta


def schedule_to_string(events):
    lines = []
    events_for_day = [[] for _ in range(5)]

    for event in events:
        events_for_day[event.day].append(event)

    LEN = 90
    TIME_MIN = time(7, 0)
    TIME_MAX = time(22, 0)
    STEPS = 16

    time_markers = " " * LEN
    for i in range(STEPS):
        weight = (i / (STEPS - 1))
        cur_time = _get_weighted_average_time(TIME_MIN, TIME_MAX, weight)
        time_markers = _replace_string_part(time_markers, str(cur_time.hour), int((i / (STEPS - 1)) * LEN))

    lines.append('=' * LEN)
    lines.append(time_markers)
    for day_index, day_events in enumerate(events_for_day):
        lines.append(calendar.day_abbr[day_index] + ('-' * (LEN - 3)))
        day_string = " " * LEN
        for event in day_events:
            pos_from = int(_time_to_position(TIME_MIN, TIME_MAX, event.time_from) * LEN)
            pos_to = int(_time_to_position(TIME_MIN, TIME_MAX, event.time_to) * LEN)
            event_string = "[" + (" " * (pos_to - pos_from - 2)) + "]"
            event_string = _replace_string_part(event_string, event.name[:len(event_string) - 2], 1)
            day_string = _replace_string_part(day_string, event_string, pos_from)
        lines.append(day_string)
    lines.append('=' * LEN)

    return "\n".join(lines)


def _replace_string_part(s, t, i_from):
    """
    >>> _replace_string_part("aaaaaa", "bb", 1)
    'abbaaa'
    """
    i_to = i_from + len(t)
    return s[:i_from] + t + s[i_to:]


def _get_weighted_average_time(t1, t2, weight):
    """
    >>> _get_weighted_average_time(time(7, 0), time(12, 0), 0.4)
    datetime.time(9, 0)
    """
    delta = _time_to_datetime(t2) - _time_to_datetime(t1)
    return (_time_to_datetime(t1) + delta * weight).time()


def _time_to_position(t_min, t_max, t):
    # TODO: More reasonable name
    whole_delta = _time_to_datetime(t_max) - _time_to_datetime(t_min)
    part_delta = _time_to_datetime(t) - _time_to_datetime(t_min)

    return part_delta / whole_delta


def _time_to_datetime(t):
    """
    We cannot perform arithmetic on time objects, but we can on datetime objects
    """
    return datetime.combine(date.today(), t)
