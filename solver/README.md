# Samorozvrh solver
Uses Google OR Tools to create a schedule according to the given parameters.

## Input format
See `fixtures/example.json` for an example.

The format in pseudo-JSON (with comments):
```js
[                           // List of courses from which to select
  {
    "name": "course_name",  // For display purposes
    "reward": 100,          // The solver tries to maximize the sum of the rewards of selected courses
    // Each course may have multiple options; to select this course, you can select any one of these
    "options": [            
    // Each option is an array of events - selecting the option means selecting all of its events
      [                     
        {
          "day": 0,         // Days are indexed from 0 to 4 (mon-fri)
          "time_from": "12:00",
          "time_to": "13:30",
          "name": "opt1a"
        },
        {
          "day": 1,
          "time_from": "10:00",
          "time_to": "11:30",
          "name": "opt1b"
        }
      ],
      [                     // Here the second option consists of just a single event
        {
          "day": 4,
          "time_from": "15:00",
          "time_to": "17:00",
          "name": "foo2"
        }
      ],
    ]
  },
  { /* more courses */ }
]
```

If we assume there is just the course shown in the example, this means we can either
have a class on Monday, 12:00-13:30 and a class on Tuesday, 10:00-11:30,
or on Friday, 15:00-17:00.

If the solver were to select this course (by selecting either option), it would get
a reward of 100. The solver tries to maximize the sum of these rewards.
