import calendar
from datetime import time, date, datetime, timedelta


class Course:

    options = []  # type: List[List[Event]]

    def __init__(self, options=[], name=None):
        self.options = options
        self.name = name

    def __repr__(self):
        return str(self.options)


class Event:

    def __init__(self, day, time_from, time_to, week_parity=None, name=None):
        if int(day) != day or not (0 <= day <= 6):
            raise ValueError("Day must be an integer between 0 and 6 (got {})".format(day))

        if time_from >= time_to:
            raise ValueError("Expected time_from < time_to (got {}, {})".format(time_from, time_to))

        self.day = day
        self.time_from = time_from
        self.time_to = time_to
        self.week_parity = week_parity
        self.name = name

    def __repr__(self):
        return "{name}: {day} {time_from}–{time_to}".format(
            name=(self.name if self.name else "Event"),
            day=calendar.day_abbr[self.day],
            time_from=self.time_from.strftime('%H:%M'),
            time_to=self.time_to.strftime('%H:%M'),
        )


def load_course(json_obj):
    try:
        name = json_obj["name"]
        options = []
        for opt in json_obj["options"]:
            options.append([load_event(e) for e in opt])

        return Course(options, name=name)
    except KeyError as e:
        raise ValueError("Missing field in course JSON object: {}".format(e))


def load_event(json_obj):
    try:
        day = json_obj["day"]
        time_from = _parse_time(json_obj["time_from"])
        time_to = _parse_time(json_obj["time_to"])
        name = json_obj.get("name", None)

        return Event(day, time_from, time_to, name=name)
    except KeyError as e:
        raise ValueError("Missing field in event JSON object: {}".format(e))

    return None


def _parse_time(s):
    """
    >>> _parse_time("21:30")
    datetime.time(21, 30)
    """
    return datetime.strptime(s, "%H:%M").time()
