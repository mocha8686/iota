package env

import (
	"database/sql"
	"errors"
	"fmt"
	"html/template"
	"net/http"

	"github.com/rs/zerolog/log"

	"github.com/mocha8686/iota/auth/providers"
	"github.com/mocha8686/iota/model"
	"github.com/mocha8686/iota/response"
)

type Env struct {
	DB       *sql.DB
	Users    model.UserEnv
	Sessions model.SessionEnv
	Accounts model.AccountEnv
}

func New(db *sql.DB) *Env {
	return &Env{
		DB:       db,
		Users:    model.NewUserEnv(db),
		Sessions: model.NewSessionEnv(db),
		Accounts: model.NewAccountEnv(db),
	}
}

func (env *Env) AllUsers(w http.ResponseWriter, r *http.Request) {
	users, err := env.Users.All()
	if err != nil {
		log.Err(err).Msg("AllUsers")
		response.RenderStatusErr(w, r, http.StatusInternalServerError, err)
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
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	if err := user.ParseUserFromRows(ulidStr); err != nil {
		return nil, err
	}

	return &user, nil
}

type UserAccount struct {
	Account  model.Account
	Exists   bool
	Username string
	Icon     template.HTMLAttr
}

func (env *Env) UserAccounts(templates *template.Template) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		user, ok := model.UserFromContext(r.Context())
		if !ok {
			response.RenderStatusErr(w, r, http.StatusUnauthorized, nil)
			return
		}

		accounts, err := env.Accounts.AllOfUser(user.ID)
		if err != nil {
			log.Err(err).Msg("Getting user accounts")
			response.RenderStatusErr(w, r, http.StatusInternalServerError, err)
			return
		}

		for _, provider := range providers.Providers {
			var ua UserAccount

			ua.Account = accounts[provider.Name]
			if ua.Account.ProviderName == "" {
				ua.Account.ProviderName = provider.Name
				ua.Exists = false
			} else {
				// TODO: discord bot account
				username, err := provider.FetchUsername(ua.Account.ExternalID)
				if err != nil {
					log.Err(err).Str("provider", provider.Name).Str("externalID", ua.Account.ExternalID).Msg("Getting username from provider")
				}
				ua.Username = username
				ua.Exists = true
			}

			ua.Icon = template.HTMLAttr(fmt.Sprintf("icon=\"%s\"", provider.Icon))

			template, err := templates.Lookup("account.html").Clone()
			if err != nil {
				log.Err(err).Msg("Cloning account template")
				response.RenderStatusErr(w, r, http.StatusInternalServerError, err)
				return
			}

			if err := template.Execute(w, ua); err != nil {
				log.Err(err).Msg("Executing account template")
				response.RenderStatusErr(w, r, http.StatusInternalServerError, err)
				return
			}
		}
	}
}
