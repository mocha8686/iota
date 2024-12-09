package env

import (
	"database/sql"
	"fmt"
	"net/http"

	"github.com/oklog/ulid/v2"
	"github.com/rs/zerolog/log"

	"github.com/mocha8686/iota/model"
	"github.com/mocha8686/iota/response"
)

type Env struct {
	DB       *sql.DB
	Users    model.UserEnv
	Sessions model.SessionEnv
}

func New(db *sql.DB) *Env {
	return &Env{
		DB:    db,
		Users: model.NewUserEnv(db),
		Sessions: model.NewSessionEnv(db),
	}
}

func (env *Env) AllUsers(w http.ResponseWriter, r *http.Request) {
	users, err := env.Users.All()
	if err != nil {
		log.Err(err).Msg("AllUsers")
		response.RenderStatusErr(w, r, http.StatusInternalServerError)
		return
	}

	fmt.Fprint(w, "<ul>")
	for _, user := range users {
		fmt.Fprintf(w, "<li>%s</li>", user.Username)
	}
	fmt.Fprint(w, "</ul>")
}

func (env *Env) LoginInfoFromAccountInfo(providerName, externalID string) (*model.User, error) {
	const query = `
SELECT u.id, u.ulid, u.username
FROM oauth_accounts oa
JOIN users u ON oa.user_id = u.id
WHERE oa.provider_name = ? AND oa.external_id = ?
`
	row := env.DB.QueryRow(query, providerName, externalID)

	var user model.User
	var ulidStr string
	if err := row.Scan(&user.ID, &ulidStr, &user.Username); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	ulid, err := ulid.Parse(ulidStr)
	if err != nil {
		return nil, err
	}
	user.ULID = ulid

	return &user, nil
}
