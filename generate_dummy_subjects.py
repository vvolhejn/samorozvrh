import json
import datetime


day_names = ["PO", "UT", "ST", "CT", "PA"]
long_day_names = ["pondělí", "úterý", "středa", "čtvrtek", "pátek"]
earliest_break = datetime.datetime(2000, 1, 1, 10, 0)


def save_subject(name, data):
    with open("cache/courses/{}".format(name), "w") as f:
        json.dump({"data": data}, f)


def gen_break():
    for day_index, day_name, long_day_name in zip(range(5), day_names, long_day_names):
        cur_data = []
        for halfhour in range(2 * 5 + 1):
            start_time = earliest_break + datetime.timedelta(minutes=30 * halfhour)
            end_time = earliest_break + datetime.timedelta(minutes=30 * (halfhour + 2))

            cur_data.append([{
                "type": "J",
                "name": "Pauza {}".format(long_day_name),
                "teacher": "{}".format(start_time.strftime("%H:%M")),
                "day": day_index,
                "time_from": start_time.strftime("%H:%M"),
                "time_to": end_time.strftime("%H:%M"),
                "week_parity": 0,
            }])

        save_subject("PAUZA_{}".format(day_name), cur_data)


def gen_specific_free_day():
    for day_index, day_name, long_day_name in zip(range(5), day_names, long_day_names):
        cur_data = [[{
            "type": "J",
            "name": "Volno {}".format(long_day_name),
            "teacher": "",
            "day": day_index,
            "time_from": "07:00",
            "time_to": "20:00",
            "week_parity": 0,
        }]]
        save_subject("VOLNO_{}".format(day_name), cur_data)


def gen_any_free_day():
    cur_data = []
    for day_index, day_name, long_day_name in zip(range(5), day_names, long_day_names):
        cur_data.append([{
            "type": "J",
            "name": "Volno libovolný den".format(long_day_name),
            "teacher": "{}".format(long_day_name),
            "day": day_index,
            "time_from": "07:00",
            "time_to": "20:00",
            "week_parity": 0,
        }])
    save_subject("VOLNO_NEKDY", cur_data)


def main():
    gen_break()
    gen_specific_free_day()
    gen_any_free_day()


if __name__ == '__main__':
    main()
    print("Ok, generated dummy subjects")
