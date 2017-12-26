package sisparse

import (
	"errors"
	"fmt"
	"io"

	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/yhat/scrape"
	"golang.org/x/net/html"
	"golang.org/x/net/html/atom"
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

const sisUrl = "https://is.cuni.cz/studium/predmety/index.php?do=predmet&kod=%s"

func GetCourseEvents(courseCode string) ([]Event, error) {
	resp, err := http.Get(fmt.Sprintf(sisUrl, courseCode))
	if err != nil {
		return nil, err
	}
	relativeScheduleUrl, err := getRelativeScheduleUrl(resp.Body)
	if err != nil {
		return []Event{}, nil
	}
	scheduleUrl := getAbsoluteUrl(sisUrl, relativeScheduleUrl)

	resp, err = http.Get(scheduleUrl)
	if err != nil {
		return nil, err
	}
	return parseCourseEvents(resp.Body), nil
}

func getRelativeScheduleUrl(body io.ReadCloser) (string, error) {
	const scheduleLinkText = "Rozvrh"

	root, err := html.Parse(body)
	if err != nil {
		panic(err)
	}

	matcher := func(n *html.Node) bool {
		if n.DataAtom == atom.A {
			return scrape.Text(n) == scheduleLinkText
		}
		return false
	}

	scheduleLink, ok := scrape.Find(root, matcher)
	if !ok {
		return "", errors.New("Couldn't find schedule URL")
	}
	return scrape.Attr(scheduleLink, "href"), nil
}

func parseCourseEvents(body io.ReadCloser) []Event {
	root, err := html.Parse(body)
	if err != nil {
		panic(err)
	}

	matcher := func(n *html.Node) bool {
		if n.DataAtom == atom.Tr && n.Parent != nil && n.Parent.Parent != nil {
			return scrape.Attr(n.Parent.Parent, "id") == "table1" &&
				scrape.Attr(n, "class") != "head1" // ignore table header
		}
		return false
	}

	eventsTable := scrape.FindAll(root, matcher)
	if len(eventsTable) == 0 {
		panic("Couldn't find events table")
	}
	res := make([]Event, len(eventsTable))
	for i, e := range eventsTable {
		res[i] = parseEvent(e)
	}
	return res
}

func parseEvent(event *html.Node) Event {
	var cols []string
	for col := event.FirstChild; col != nil; col = col.NextSibling {
		// For some reason we also get siblings with no tag and no data?
		if len(strings.TrimSpace(col.Data)) > 0 {
			cols = append(cols, scrape.Text(col))
		}
	}

	e := Event{
		Type:    cols[1],
		Name:    cols[2],
		Teacher: cols[3],
	}

	addEventScheduling(&e, cols[4], cols[6])
	return e
}

func addEventScheduling(e *Event, daytime string, dur string) {
	// For strings such as "Út 12:20"
	daytimeRunes := []rune(daytime)
	e.Day = parseDay(string(daytimeRunes[:2]))

	timeFrom, err := time.Parse("15:04", string(daytimeRunes[3:]))
	if err != nil {
		panic(fmt.Sprintf("Unable to parse time: %s", string(daytimeRunes[3:])))
	}

	d, parity := parseDurationAndWeekParity(dur)

	e.TimeFrom = timeFrom
	e.TimeTo = timeFrom.Add(time.Minute * time.Duration(d))
	e.WeekParity = parity
}

func parseDurationAndWeekParity(dur string) (int, int) {
	// Strings like "90" or "240 Sudé týdny (liché kalendářní)"
	w := strings.Fields(dur)
	d, err := strconv.Atoi(w[0])
	if err != nil {
		panic(fmt.Sprintf("Unable to parse duration: %s", err))
	}
	parity := 0
	if len(w) > 1 {
		if w[1] == "Liché" {
			parity = 1
		} else {
			parity = 2
		}
	}
	return d, parity
}

func parseDay(day string) int {
	days := []string{"Po", "Út", "St", "Čt", "Pá"}
	for i, d := range days {
		if d == day {
			return i
		}
	}
	panic(fmt.Sprintf("Unknown day \"%s\"", day))
}

func getAbsoluteUrl(base, relative string) string {
	baseUrl, err := url.Parse(base)
	if err != nil {
		panic(err)
	}
	relativeUrl, err := url.Parse(relative)
	if err != nil {
		panic(err)
	}
	return baseUrl.ResolveReference(relativeUrl).String()
}
