// Prg1: NPRG030
// ADS2: NTIN061
// Haskell: NAIL097
package main

import (
	"encoding/json"
	"fmt"
	"github.com/iamwave/samorozvrh/sisparse"
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

func main() {
	http.HandleFunc("/sisquery/", sisQueryHandler)

	// Path relative to the directory the binary is ran in
	fs := http.FileServer(http.Dir("static"))
	http.Handle("/", fs)

	fmt.Println("Listening on :8080")
	http.ListenAndServe(":8080", nil)
}
