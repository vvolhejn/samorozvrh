"""
Terms such as course, option, event, reward are explained in README.md
"""
import calendar
from datetime import datetime

DEFAULT_COURSE_REWARD = 1


class Course:
    options = []

    def __init__(self, options=[], name=None, reward=DEFAULT_COURSE_REWARD):
        self.options = options
        self.name = name
        self.reward = reward

    def __repr__(self):
        return str(self.options)

    def load(json_obj):
        # Given a course in a JSON object, return the corresponding Course instance
        try:
            name = json_obj['name']
            reward = json_obj.get('reward', DEFAULT_COURSE_REWARD)
            options = []
            for opt in json_obj['options']:
                options.append([Event.load(e) for e in opt])

            return Course(options, name=name, reward=reward)
        except KeyError as e:
            raise ValueError('Missing field in course JSON object: {}'.format(e))


class Event:

    def __init__(self, day, time_from, time_to, week_parity=0, name=None, building=None):
        if int(day) != day or not (0 <= day <= 6):
            raise ValueError('Day must be an integer between 0 and 6 (got {})'.format(day))

        if time_from >= time_to:
            raise ValueError('Expected time_from < time_to (got {}, {})'.format(time_from, time_to))

        self.day = day
        self.time_from = time_from
        self.time_to = time_to
        self.week_parity = week_parity  # 0: both weeks, 1: odd weeks, 2: even weeks
        self.name = name
        self.building = building

    def __repr__(self):
        return '{name}: {day} {time_from}–{time_to}'.format(
            name=(self.name if self.name else 'Event'),
            day=calendar.day_abbr[self.day],
            time_from=self.time_from.strftime('%H:%M'),
            time_to=self.time_to.strftime('%H:%M'),
        )

    def load(json_obj):
        # Given an event in a JSON object, return the corresponding Event instance
        try:
            day = json_obj['day']
            time_from = _parse_time(json_obj['time_from'])
            time_to = _parse_time(json_obj['time_to'])
            name = json_obj.get('name', None)
            building = json_obj.get('building', None)

            return Event(day, time_from, time_to, name=name, building=building)
        except KeyError as e:
            raise ValueError('Missing field in event JSON object: {}'.format(e))


class TransferInfo:
    """
    Contains data about transfer times between different buildings.
    Is able to answer queries of type: "How long does it take building from A to B?"
    """

    def __init__(self, names, transfer_times):
        self.names = names
        self.transfer_times = transfer_times
        self.name_to_index = dict((x, i) for i, x in enumerate(names))

    def create_distance_callback(self, buildings):
        def f(i1, i2):
            j1, j2 = [self.name_to_index.get(buildings[i], -1) for i in [i1, i2]]
            if j1 == -1 or j2 == -1:
                return 0
            # print(self.names[j1], self.names[j2], self.transfer_times[j1][j2])
            return self.transfer_times[j1][j2]

        return f

    def add_to_transfer_times(self, added):
        self.transfer_times = [[max(0, x + added) for x in row] for row in self.transfer_times]

    def load(json_obj):
        try:
            b = json_obj['buildings']
            names = b['names']
            transfer_times = b['transfer_times']
            return TransferInfo(names, transfer_times)
        except KeyError as e:
            # It's ok if we don't have this
            return TransferInfo([], [])


def load_course_array(json_obj):
    return [Course.load(course) for course in json_obj]


def _parse_time(s):
    """
    >>> _parse_time('21:30')
    datetime.time(21, 30)
    """
    return datetime.strptime(s, '%H:%M').time()
