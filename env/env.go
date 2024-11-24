package env

import (
	"database/sql"
	"fmt"
	"net/http"

	"github.com/rs/zerolog/log"

	"github.com/mocha8686/iota/model"
)

type Env struct {
	users model.UserEnv
}

func New(db *sql.DB) *Env {
	return &Env{
		users: model.NewUserEnv(db),
	}
}

func (env *Env) AllUsers(w http.ResponseWriter, r *http.Request) {
	users, err := env.users.All()
	if err != nil {
		log.Err(err).Msg("AllUsers")
		status := http.StatusInternalServerError
		http.Error(w, http.StatusText(status), status)
		return
	}

	fmt.Fprint(w, "<ul>")
	for _, user := range users {
		fmt.Fprintf(w, "<li>%s</li>", user.Username)
	}
	fmt.Fprint(w, "</ul>")
}
