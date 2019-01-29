package sisparse

import (
	"encoding/json"
	"time"
)

type Event struct {
	Type       string
	Name       string
	Teacher    string
	Room       string
	Language   string
	Day        int
	TimeFrom   time.Time
	TimeTo     time.Time
	WeekParity int // Every week = 0; Odd weeks = 1; Even weeks = 2
}

func (e Event) MarshalJSON() ([]byte, error) {
	// IIRC, we cannot directly marshal the Event because we need to format the time
	// which is why we put it into a new struct where the time is a string
	return json.Marshal(&struct {
		Type       string `json:"type"`
		Name       string `json:"name"`
		Teacher    string `json:"teacher"`
		Room       string `json:"room"`
		Language   string `json:"language"`
		Day        int    `json:"day"`
		TimeFrom   string `json:"time_from"`
		TimeTo     string `json:"time_to"`
		WeekParity int    `json:"week_parity"`
	}{
		Type:       e.Type,
		Name:       e.Name,
		Teacher:    e.Teacher,
		Room:       e.Room,
		Language:   e.Language,
		Day:        e.Day,
		TimeFrom:   e.TimeFrom.Format("15:04"),
		TimeTo:     e.TimeTo.Format("15:04"),
		WeekParity: e.WeekParity,
	})
}
