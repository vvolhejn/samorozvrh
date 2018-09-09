// An interface to the Python solver.
package main

import (
	"fmt"
	"io/ioutil"
	"os"
	"os/exec"
	"path"
	"strings"
)

const SOLVER_COMMAND = "python3 -m pipenv run python solver/main.py"

func Solve(query []byte) ([]byte, error) {
	// Create a temporary file with the query, feed it to the solver
	// and run it

	tempfile, err := createQueryFile(query)
	if err != nil {
		return nil, err
	}
	defer os.Remove(tempfile.Name()) // clean up

	commandParts := strings.Split(SOLVER_COMMAND+" "+tempfile.Name(), " ")
	subProcess := exec.Command(commandParts[0], commandParts[1:]...)
	// Run relative to the directory given by -rootdir
	subProcess.Dir = path.Join(rootDir, "solver")

	res, err := subProcess.CombinedOutput()
	fmt.Printf("%s\n%s\n", res, err)
	if err != nil {
		return nil, err
	}
	return res, nil
}

func createQueryFile(query []byte) (*os.File, error) {
	tempfile, err := ioutil.TempFile("", "query")
	if err != nil {
		return nil, err
	}
	if _, err := tempfile.Write(query); err != nil {
		return nil, err
	}
	if err := tempfile.Close(); err != nil {
		return nil, err
	}
	return tempfile, nil
}
