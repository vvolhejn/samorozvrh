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
	"net/http"
	"path"
	"strings"
)

const FRONTEND_DIR = "frontend/dist"

var rootDir string

func sisQueryHandler(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Path[len("/sisquery/"):]
	if strings.Contains(query, "/") {
		fmt.Fprintf(w, `{"error":"Query should not contain slashes"}`)
		return
	}
	var res string
	var err error
	fmt.Printf("sisquery: %s", query)
	if isCached(query) {
		fmt.Println(" (using cache)")
		res, err = getCache(query)
	} else {
		fmt.Println(" (querying)")
		events, err := sisparse.GetCourseEvents(query)
		if err == nil {
			s, _ := json.Marshal(events)
			res = fmt.Sprintf(`{"data":%s}`, string(s))
			err = setCache(query, res)
		}
	}

	if err != nil {
		fmt.Fprintf(w, `{"error":"%s"}`, err)
	} else {
		fmt.Fprint(w, res)
	}
}

func solverQueryHandler(w http.ResponseWriter, r *http.Request) {
	body, err := ioutil.ReadAll(r.Body)
	r.Body.Close()
	if err != nil {
		fmt.Fprintf(w, `{"error":"%s"}`, err)
		return
	}
	fmt.Println(string(body))
	if len(body) == 0 {
		fmt.Fprint(w, `{"error":"Request body must be non-empty"}`)
		return
	}

	fmt.Printf("Body: %s\n", string(body))
	res, err := Solve(body)
	if err != nil {
		fmt.Fprintf(w, `{"error":"%s"}`, err)
	} else {
		fmt.Fprint(w, string(res))
	}
}

func main() {
	ip := flag.String("rootdir", ".", "path to Samorozvrh root directory")
	flag.Parse()
	rootDir = *ip

	http.HandleFunc("/sisquery/", sisQueryHandler)
	http.HandleFunc("/solverquery/", solverQueryHandler)

	fs := http.FileServer(http.Dir(path.Join(rootDir, FRONTEND_DIR)))
	http.Handle("/", fs)

	fmt.Println("Listening on :8080")
	http.ListenAndServe(":8080", nil)
}
