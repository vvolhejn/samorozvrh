package sisparse

import (
	"encoding/json"
	"time"
)

type Event struct {
	Type       string
	Name       string
	Teacher    string
	Day        int
	TimeFrom   time.Time
	TimeTo     time.Time
	WeekParity int // Every week = 0; Odd weeks = 1; Even weeks = 2
}

func JSONEncodeEvent(e *Event) ([]byte, error) {
	return json.Marshal(&struct {
		Type       string `json:"type"`
		Name       string `json:"name"`
		Teacher    string `json:"teacher"`
		Day        int    `json:"day"`
		TimeFrom   string `json:"time_from"`
		TimeTo     string `json:"time_to"`
		WeekParity int    `json:"week_parity"`
	}{
		Type:       e.Type,
		Name:       e.Name,
		Teacher:    e.Teacher,
		Day:        e.Day,
		TimeFrom:   e.TimeFrom.Format("15:04"),
		TimeTo:     e.TimeTo.Format("15:04"),
		WeekParity: e.WeekParity,
	})
}

// func JSONDecodeEvent(s *string) Event {
// 	return {}
// }
