package auth

import (
	"net/http"

	"github.com/rs/zerolog/log"

	"github.com/mocha8686/iota/env"
	"github.com/mocha8686/iota/model"
	"github.com/mocha8686/iota/response"
	"github.com/mocha8686/iota/sessions"
)

func Logout(env *env.Env) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		session, ok := model.SessionFromContext(r.Context())
		if !ok {
			http.Redirect(w, r, "/", http.StatusFound)
			return
		}

		if err := env.Sessions.Delete(session.ID); err != nil {
			log.Err(err).Msg("Deleting session during logout")
			response.RenderStatusErr(w, r, http.StatusInternalServerError, err)
			return
		}

		sessions.DeleteSessionCookie(w)

		http.Redirect(w, r, "/", http.StatusFound)
	}
}
