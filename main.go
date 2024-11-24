package main

import (
	"database/sql"
	_ "embed"
	"fmt"
	"html/template"
	"math/rand/v2"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	_ "github.com/mattn/go-sqlite3"
	"github.com/mocha8686/iota/env"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

func main() {
	logMiddleware := setupLogger()

	port, exists := os.LookupEnv("PORT")
	if !exists {
		port = "8000"
	}

	db, err := sql.Open("sqlite3", "./test.db")
	if err != nil {
		log.Fatal().Err(err).Msg("Opening database")
	}
	defer db.Close()

	env := env.New(db)

	r := chi.NewRouter()
	r.Use(logMiddleware)

	r.Get("/", http.FileServer(http.Dir("frontend/public")).ServeHTTP)
	r.Get("/api/rand", randomColor)
	r.Get("/api/users", env.AllUsers)

	log.Info().Msg(fmt.Sprintf("Listening on port %v.", port))

	if err := http.ListenAndServe(fmt.Sprintf(":%v", port), r); err != nil {
		log.Fatal().Msg("Failed to start HTTP server")
	}
}

func setupLogger() func(http.Handler) http.Handler {
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})
	return middleware.RequestLogger(&middleware.DefaultLogFormatter{Logger: &log.Logger, NoColor: false})
}

//go:embed frontend/templates/header.html
var headerText string
var header = template.Must(template.New("header").Parse(headerText))

func randomColor(w http.ResponseWriter, _ *http.Request) {
	r, g, b := rand.IntN(255), rand.IntN(255), rand.IntN(255)
	color := fmt.Sprintf("rgb(%v, %v, %v)", r, g, b)

	if err := header.Execute(w, template.CSS(color)); err != nil {
		log.Err(err).Msg("Writing template")
		return
	}
}
