// Prg1: NPRG030
// ADS2: NTIN061
// Haskell: NAIL097
package main

import (
	"encoding/json"
	"fmt"
	"github.com/iamwave/samorozvrh/sisparse"
	"io/ioutil"
	"net/http"
)

func sisQueryHandler(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Path[len("/sisquery/"):]
	events, err := sisparse.GetCourseEvents(query)
	if err != nil {
		fmt.Fprintf(w, `{"error":"%s"}`, err)
	} else {
		s, _ := json.Marshal(events)
		fmt.Fprintf(w, `{"data":%s}`, string(s))
	}
}

func solverQueryHandler(w http.ResponseWriter, r *http.Request) {
	body, err := ioutil.ReadAll(r.Body)
	r.Body.Close()
	if err != nil {
		fmt.Fprintf(w, `{"error":"%s"}`, err)
		return
	}
	fmt.Fprint(w, string(body))
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
	http.HandleFunc("/sisquery/", sisQueryHandler)
	http.HandleFunc("/solverquery/", solverQueryHandler)

	// Path relative to the directory the binary is ran in
	fs := http.FileServer(http.Dir("static"))
	http.Handle("/", fs)

	fmt.Println("Listening on :8080")
	http.ListenAndServe(":8080", nil)
}
