package cache

import (
	"io/ioutil"
	"os"
	"path"
)

func Has(name []string) bool {
	if _, err := os.Stat(getFilename(name)); err != nil {
		if os.IsNotExist(err) {
			return false
		}
	}
	return true
}

func Set(name []string, data string) error {
	err := os.MkdirAll(path.Dir(getFilename(name)), 0755)
	if err != nil {
		return err
	}
	filename := getFilename(name)
	return ioutil.WriteFile(filename, []byte(data), 0644)
}

func Get(name []string) (string, error) {
	filename := getFilename(name)
	res, err := ioutil.ReadFile(filename)
	return string(res), err
}

func getFilename(name []string) string {
	return path.Join(append([]string{rootDir, "cache"}, name...)...)
}

// Globally set by main at the beginning of execution
var rootDir string

func SetRootDir(rd string) {
	rootDir = rd
}

func GetRootDir() string {
	return rootDir
}
