package main

import (
	"fmt"
	"time"
)

func main() {
	fmt.Print("\033[2J")
	fmt.Print("\033[H")

	dur := 3 * 1000

	for {
		secs := dur / 1000
		h := secs / 3600
		m := secs % 3600 / 60
		s := secs % 60

		fmt.Print("\033[H")
		fmt.Print("\033[2K")
		fmt.Printf("%02d:%02d:%02d\n", h, m, s)

		if dur <= 0 {
			break
		}

		dur -= 1000
		time.Sleep(time.Second)
	}
}
