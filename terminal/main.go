package main

import (
	"fmt"
	"os"
	"time"
)

func main() {
	duration := time.Minute * 40

	if len(os.Args) > 1 {
		var err error

		if duration, err = time.ParseDuration(os.Args[1]); err != nil {
			fmt.Println("timer duration is invalid, must be 3h4m5s")
			os.Exit(1)
		}
	}

	for {
		fmt.Print("\033[2J\033[H")

		h := duration / time.Hour
		m := duration % time.Hour / time.Minute
		s := duration % time.Hour % time.Minute / time.Second

		fmt.Printf("%02d:%02d:%02d\n", h, m, s)

		if duration <= 0 {
			break
		}

		duration -= time.Second
		time.Sleep(time.Second)
	}
}
