// Prg1: NPRG030
// ADS2: NTIN061
// Haskell: NAIL097
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"github.com/iamwave/samorozvrh/sisparse"
	"io/ioutil"
	"log"
	"net/http"
	"path"
	"regexp"
	"strconv"
	"strings"
)

const FRONTEND_DIR = "frontend/dist"

var rootDir string

func sisQueryHandler(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Path[len("/sisquery/"):]
	query = strings.Trim(query, " ")

	if len(query) > 32 {
		fmt.Fprintf(w, `{"error":"The query is too long"}`)
		return
	}

	re := regexp.MustCompile("^[0-9a-zA-z]*$")

	if !re.MatchString(query) {
		fmt.Fprintf(w, `{"error":"Query must contain only alphanumeric characters"}`)
		return
	}
	var res string
	var err error

	query = strings.ToUpper(query)
	log.Printf("Sisquery: %s", ellipsis(query, 10))

	if isCached(query) {
		log.Println("  (using cache)")
		res, err = getCache(query)
	} else {
		log.Println("  (querying)")
		var events [][]sisparse.Event
		events, err = sisparse.GetCourseEvents(query)
		if err == nil {
			var s []byte
			s, err = json.Marshal(events)
			if err == nil {
				res = fmt.Sprintf(`{"data":%s}`, string(s))
				err = setCache(query, res)
			}
		}
	}

	if err != nil {
		log.Printf("Sisquery error: %s", err)
		fmt.Fprintf(w, `{"error":"%s"}`, err)
	} else {
		log.Printf(`Sisquery answer: %s`, ellipsis(res, 30))
		fmt.Fprint(w, res)
	}
}

func solverQueryHandler(w http.ResponseWriter, r *http.Request) {
	body, err := ioutil.ReadAll(r.Body)
	r.Body.Close()
	if err != nil {
		log.Printf("Solverquery error: %s", err)
		fmt.Fprintf(w, `{"error":"%s"}`, err)
		return
	}
	if len(body) == 0 {
		log.Printf("Solverquery error: %s", err)
		fmt.Fprint(w, `{"error":"Request body must be non-empty"}`)
		return
	}

	log.Printf("Solverquery: %s\n", ellipsis(string(body), 30))
	res, err := Solve(body)
	if err != nil {
		log.Printf("Solverquery error: %s", err)
		fmt.Fprintf(w, `{"error":"%s"}`, err)
	} else {
		log.Printf("Solverquery answer: %s", ellipsis(string(res), 30))
		fmt.Fprint(w, string(res))
	}
}

func main() {
	rdir := flag.String("rootdir", ".", "path to Samorozvrh root directory")
	port := flag.Int("port", 8080, "port on which to start the server")
	flag.Parse()
	rootDir = *rdir

	http.HandleFunc("/sisquery/", sisQueryHandler)
	http.HandleFunc("/solverquery/", solverQueryHandler)

	fs := http.FileServer(http.Dir(path.Join(rootDir, FRONTEND_DIR)))
	http.Handle("/", fs)

	log.Printf("Listening on: %d", *port)
	err := http.ListenAndServe(":"+strconv.Itoa(*port), nil)
	if err != nil {
		log.Fatalf("Could not start server: %s\n", err)
	}
}

func ellipsis(s string, n int) string {
	if len(s) < n {
		return s
	} else {
		return s[:n] + "..."
	}
}
