#!/usr/local/bin/python3
"""
Use the Google Maps API to compute transfer times between buildings
and print it as a matrix in JSON
"""
import argparse
import datetime
import json
import requests
import os

API_URL = 'https://maps.googleapis.com/maps/api/distancematrix/json'
API_MAX_BUILDINGS = 25  # Limit set by the Google Maps API
DEFAULT_DEPARTURE_TIME = datetime.time(12, 00, 00,
                                       tzinfo=datetime.timezone(datetime.timedelta(hours=+1)))
DEFAULT_TRAVEL_MINS = 30


def get_transfer_time_matrix(api_key):
    # Only the API_MAX_BUILDINGS most common buildings
    buildings = get_buildings_in_cache()[:API_MAX_BUILDINGS]
    encoded_buildings = '|'.join(buildings)

    departure_datetime = datetime.datetime.combine(datetime.date.today(), DEFAULT_DEPARTURE_TIME)
    timestamp = int(departure_datetime.timestamp())

    params = {
        'key': api_key,
        'origins': encoded_buildings,
        'destinations': encoded_buildings,
        'mode': 'transit',
        'departure_time': timestamp,
    }
    r = requests.get(API_URL, params=params)

    if r.status_code != 200:
        raise RuntimeError('Returned status was {}'.format(r.status_code))

    mat = parse_api_response(r.json())

    res = {
        'names': buildings,
        'transfer_times': mat,
    }

    return res


def parse_api_response(data):
    if data['status'] != 'OK':
        raise RuntimeError('Query was not OK: {}'.format(data))

    res = []
    for row in data['rows']:
        res_row = []
        for cell in row['elements']:
            if cell['status'] != 'OK':
                res_row.append(DEFAULT_TRAVEL_MINS)
            else:
                res_row.append(cell['duration']['value'] // 60)

        res.append(res_row)

    return res


def get_buildings_in_cache():
    """
    Return a list of the buildings cached, sorted in descending order
    by the number of rooms in the cache which are in this building
    """
    cache_dir = os.path.join(os.path.dirname(os.path.realpath(__file__)),
                             '..', 'cache', 'rooms')
    building_occurrences = {}
    for fn in os.listdir(cache_dir):
        with open(os.path.join(cache_dir, fn), 'r') as f:
            lines = f.readlines()
            assert len(lines) == 1
            building = lines[0]
            if building in building_occurrences:
                building_occurrences[building] += 1
            else:
                building_occurrences[building] = 1

    b = [(v, k) for k, v in building_occurrences.items()]
    b.sort()
    b.reverse()
    return [k for v, k in b]


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('api_key', type=str, help='Google Maps API key')
    args = parser.parse_args()

    dm = get_transfer_time_matrix(args.api_key)
    print(json.dumps(dm, ensure_ascii=False))
