package sisparse

import (
	"bufio"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/yhat/scrape"
	"golang.org/x/net/html"
	"golang.org/x/net/html/atom"

	"github.com/iamwave/samorozvrh/backend/cache"
)

// The year in which semester 1 begins
const schoolYear = 2019

// 1 for winter, 2 for summer
const semester = 2

const sisUrl = "https://is.cuni.cz/studium/predmety/index.php?do=predmet&kod=%s&skr=%d&sem=%d"
const scheduleBaseUrl = "https://is.cuni.cz/studium/rozvrhng/"
const scheduleUrlTemplate = "https://is.cuni.cz/studium/rozvrhng/roz_predmet_macro.php?tid=&predmet=%s&skr=%d&sem=%d&fak=%s"

const DEBUG = false

// Returns a two-dimensional array containing groups of events.
// Each group is a slice of events which must be enrolled together,
// the groups represent different times/teachers of the same course.
// Also, lectures and seminars/practicals are in separate groups.
func GetCourseEvents(courseCode string) ([][]Event, error) {
	subjectUrl := fmt.Sprintf(sisUrl, courseCode, schoolYear, semester)

	subjectHtmlRoot, err := getHtml(subjectUrl)
	if err != nil {
		return nil, err
	}
	// It is difficult to directly convert an event code to a schedule link,
	// because SIS requires the faculty number. Therefore we first open the course
	// in the "Subjects" SIS module and then go to a link which takes
	// us to the schedule.
	scheduleUrl, err := getScheduleUrl(subjectHtmlRoot, courseCode)
	if err != nil {
		return nil, err
	}

	// For some subjects (ASZLJ3010), the link has the wrong semester for whatever reason
	// (even though the correct semester is specified in the original URL).
	// Let's fix this manually.
	scheduleUrl = strings.Replace(
		scheduleUrl,
		fmt.Sprintf("sem=%d", 3-semester),
		fmt.Sprintf("sem=%d", semester),
		-1,
	)

	scheduleHtmlRoot, err := getHtml(scheduleUrl)
	if err != nil {
		return nil, err
	}
	return parseCourseEvents(scheduleHtmlRoot)
}

func getScheduleUrl(root *html.Node, courseCode string) (string, error) {
	// The schedule URL requires the code of the course's faculty.
	// First we try to get the faculty code from a link
	// and if this fails, we try to find the link to the course's schedule directly
	// (However, this link is not always available for some reason.)

	const facultyText = "Rozvrh"

	facultyMatcher := func(n *html.Node) bool {
		if n.DataAtom == atom.A {
			if strings.Contains(scrape.Attr(n, "href"), "sezn_fak") {
				return true
			}
		}
		return false
	}

	facultyLink, ok := scrape.Find(root, facultyMatcher)
	if ok {
		parts := strings.Split(scrape.Attr(facultyLink, "href"), "=")
		faculty := parts[len(parts)-1]
		url := fmt.Sprintf(scheduleUrlTemplate, courseCode, schoolYear, semester, faculty)
		return url, nil
	}

	const scheduleLinkText = "Rozvrh"

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
	relativeUrl := scrape.Attr(scheduleLink, "href")
	return getAbsoluteUrl(sisUrl, relativeUrl)
}

func parseCourseEvents(root *html.Node) ([][]Event, error) {
	if DEBUG {
		f, err := os.Create("/tmp/samorozvrh_debug.html")
		if err != nil {
			return nil, err
		}
		w := bufio.NewWriter(f)
		html.Render(w, root)
		w.Flush()
	}

	matcher := func(n *html.Node) bool {
		if n.DataAtom == atom.Tr && n.Parent != nil && n.Parent.Parent != nil {
			return (scrape.Attr(n.Parent.Parent, "id") == "table1" ||
				scrape.Attr(n.Parent.Parent, "id") == "roz_predmet_macro1") &&
				scrape.Attr(n, "class") != "head1" // ignore table header
		}
		return false
	}

	eventsTable := scrape.FindAll(root, matcher)
	if len(eventsTable) == 0 {
		// The event table is not present at all (possibly SIS returned an error message)
		return nil, errors.New("Couldn't find the event table")
	}

	res := [][]Event{}
	group := []Event{}
	for _, row := range eventsTable {
		event, err := parseEvent(row)
		if err != nil {
			return nil, err
		}
		if event == nil {
			// This could happen if an event is not scheduled, see:
			// https://is.cuni.cz/studium/rozvrhng/roz_predmet_macro.php?fak=11320&skr=2018&sem=1&predmet=NAIL062
			continue
		}
		// A non-empty name means the start of a new group;
		// names are omitted in all but the first event of a group.
		if event.Name != "" {
			if len(group) > 0 {
				res = append(res, group)
			}
			group = []Event{}
		} else {
			// Add the missing fields based on the group's first event
			event.Name = group[0].Name
			event.Teacher = group[0].Teacher
		}
		group = append(group, *event)
	}
	if len(group) > 0 {
		res = append(res, group)
	}

	if len(res) == 0 {
		return nil, errors.New("The course has no scheduled events")
	}

	return res, nil
}

func parseEvent(event *html.Node) (*Event, error) {
	var cols []string
	for col := event.FirstChild; col != nil; col = col.NextSibling {
		// For some reason we also get siblings with no tag and no data?
		if len(strings.TrimSpace(col.Data)) > 0 {
			cols = append(cols, scrape.Text(col))
		}
	}

	e := Event{
		Type:     cols[1],
		Name:     cols[2],
		Teacher:  cols[3],
		Room:     cols[5],
		Language: cols[7],
	}

	err := addEventScheduling(&e, cols[4], cols[6])
	if err != nil {
		// The event is not scheduled - this is ok
		return nil, nil
	}

	firstCol := event.FirstChild.NextSibling.FirstChild
	eventCode := scrape.Text(firstCol)
	relativeEventUrl := scrape.Attr(firstCol, "href")

	eventUrl, err := getAbsoluteUrl(scheduleBaseUrl, relativeEventUrl)
	if err != nil {
		return nil, err
	}

	err = addEventBuilding(&e, eventUrl, eventCode)
	if err != nil {
		return nil, err
	}

	return &e, err
}

func addEventBuilding(e *Event, eventUrl string, eventCode string) error {
	cacheName := []string{"rooms", e.Room}

	if cache.Has(cacheName) {
		building, err := cache.Get(cacheName)
		if err == nil {
			e.Building = building
		}
		return err
	} else {
		root, err := getHtml(eventUrl)
		if err != nil {
			return err
		}

		matcher := func(n *html.Node) bool {
			// Ex: https://is.cuni.cz/studium/rozvrhng/roz_predmet_gl.php?skr=2018&sem=1&gl=18aMB150P31p1&fak=11310
			// Must be in the correct row of the correct table
			if n.DataAtom == atom.Td &&
				hasNthParent(n, 4) &&
				n.Parent.FirstChild != n &&
				scrape.Text(n.Parent.FirstChild) == "Místo výuky:" {

				p := n.Parent.Parent.Parent.Parent
				if p.FirstChild != nil && p.FirstChild.NextSibling != nil &&
					strings.HasSuffix(scrape.Text(p.FirstChild.NextSibling), eventCode) {
					return true
				}
			}
			return false
		}

		rooms := scrape.FindAll(root, matcher)
		if len(rooms) != 1 {
			return errors.New(fmt.Sprintf("Matched %d rooms, expected 1", len(rooms)))
		}
		building, err := roomToBuilding(scrape.Text(rooms[0]))
		if err != nil {
			return err
		}
		cache.Set(cacheName, building)
		e.Building = building
	}
	return nil
}

func addEventScheduling(e *Event, daytime string, dur string) error {
	// For strings such as "Út 12:20"
	if len(daytime) == 0 {
		return errors.New("The daytime field is empty")
	}

	daytimeRunes := []rune(daytime)
	var err error
	e.Day, err = parseDay(string(daytimeRunes[:2]))
	if err != nil {
		return err
	}

	timeFrom, err := time.Parse("15:04", string(daytimeRunes[3:]))
	if err != nil {
		return err
	}

	d, parity, err := parseDurationAndWeekParity(dur)
	if err != nil {
		return err
	}

	e.TimeFrom = timeFrom
	e.TimeTo = timeFrom.Add(time.Minute * time.Duration(d))
	e.WeekParity = parity
	return nil
}

func parseDurationAndWeekParity(dur string) (int, int, error) {
	// Strings like "90" or "240 Sudé týdny (liché kalendářní)"
	w := strings.Fields(dur)
	d, err := strconv.Atoi(w[0])
	if err != nil {
		return -1, -1, errors.New(fmt.Sprintf("Unable to parse duration: %s", err))
	}
	parity := 0
	if len(w) > 1 {
		if w[1] == "Liché" {
			parity = 1
		} else {
			parity = 2
		}
	}
	return d, parity, nil
}

func parseDay(day string) (int, error) {
	days := []string{"Po", "Út", "St", "Čt", "Pá"}
	for i, d := range days {
		if d == day {
			return i, nil
		}
	}
	return -1, errors.New(fmt.Sprintf("Unknown day \"%s\"", day))
}

func getAbsoluteUrl(base, relative string) (string, error) {
	baseUrl, err := url.Parse(base)
	if err != nil {
		return "", err
	}
	relativeUrl, err := url.Parse(relative)
	if err != nil {
		return "", err
	}
	return baseUrl.ResolveReference(relativeUrl).String(), nil
}

func roomToBuilding(room string) (string, error) {
	p := strings.LastIndex(room, ") ")
	if p == -1 {
		return "", errors.New(fmt.Sprintf("Could not parse room: %s", room))
	}
	return room[p+2:], nil
}

func getHtml(url string) (*html.Node, error) {
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	return html.Parse(resp.Body)
}

func hasNthParent(node *html.Node, n int) bool {
	if n <= 0 {
		return true
	}
	for i := 0; i <= n; i++ {
		if node == nil {
			return false
		}
		node = node.Parent
	}
	return true
}
