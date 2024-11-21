package main

import (
	"fmt"
	"math/rand/v2"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

func main() {
	logMiddleware := setupLogger()

	r := chi.NewRouter()
	r.Use(logMiddleware)

	r.Get("/", http.FileServer(http.Dir("frontend/public")).ServeHTTP)
	r.Get("/api/rand", randomColor);

	port, exists := os.LookupEnv("PORT")
	if !exists {
		port = "8000"
	}

	log.Info().Msg(fmt.Sprintf("Listening on port %v.", port))

	if err := http.ListenAndServe(fmt.Sprintf(":%v", port), r); err != nil {
		log.Fatal().Msg("Failed to start HTTP server")
	}
}

func setupLogger() func(http.Handler) http.Handler {
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})
	return middleware.RequestLogger(&middleware.DefaultLogFormatter{Logger: &log.Logger, NoColor: false})
}

func randomColor(w http.ResponseWriter, _ *http.Request) {
	r,g,b := rand.IntN(255), rand.IntN(255), rand.IntN(255)
	header := fmt.Sprintf("<h1 id=\"header\" style=\"color: rgb(%v, %v, %v);\">Hello, <span x-text=\"thing\"></span>!</h1>", r, g, b)
	if _, err := w.Write([]byte(header)); err != nil {
		log.Err(err).Msg("Generating random header")
	}
}
