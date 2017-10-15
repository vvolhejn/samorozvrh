package main

import (
	"fmt"
	"io"
	"net/http"
	"path"

	"github.com/yhat/scrape"
	"golang.org/x/net/html"
	"golang.org/x/net/html/atom"
)

const sisUrl = "https://is.cuni.cz/studium/predmety/index.php?do=predmet&kod=%s"

func main() {
	resp, err := http.Get(fmt.Sprintf(sisUrl, "NAIL097"))
	if err != nil {
		panic(err)
	}

	scheduleUrl := getScheduleUrl(resp.Body)
	fmt.Println(scheduleUrl)
	fmt.Println(path.Join(path.Dir(sisUrl), scheduleUrl))

}

func getScheduleUrl(body io.ReadCloser) string {
	// The returned URL is a relative path.
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
		panic("Couldn't find schedule URL")
	}
	return scrape.Attr(scheduleLink, "href")
}
