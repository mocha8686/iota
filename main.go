package main

import (
	"fmt"
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
	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		if _, err := w.Write([]byte("Hello, Chi!")); err != nil {
			log.Err(err).Msg("Error while serving index")
		}
	})

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
