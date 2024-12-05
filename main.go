package main

import (
	"database/sql"
	_ "embed"
	"fmt"
	"net/http"
	"os"

	"github.com/go-chi/chi"
	_ "github.com/mattn/go-sqlite3"
	"github.com/mocha8686/iota/env"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

func main() {
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})

	port, exists := os.LookupEnv("PORT")
	if !exists {
		port = "8000"
	}

	dbUrl, exists := os.LookupEnv("DB_URL")
	if !exists {
		log.Fatal().Msg("Missing DB_URL")
	}

	db, err := sql.Open("sqlite3", dbUrl)
	if err != nil {
		log.Fatal().Err(err).Msg("Opening database")
	}
	defer db.Close()

	env := env.New(db)
	r := chi.NewRouter()
	register(r, env)

	log.Info().Msg(fmt.Sprintf("Listening on port %v.", port))

	if err := http.ListenAndServe(fmt.Sprintf(":%v", port), r); err != nil {
		log.Fatal().Err(err).Msg("")
	}
}

