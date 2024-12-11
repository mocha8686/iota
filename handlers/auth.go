package handlers

import (
	"errors"
	"net/http"

	"github.com/rs/zerolog/log"

	"github.com/mocha8686/iota/env"
	"github.com/mocha8686/iota/response"
	"github.com/mocha8686/iota/session"
)

func AuthMiddleware(env *env.Env) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			token, err := r.Cookie("session")
			if err != nil {
				if errors.Is(err, http.ErrNoCookie) {
					log.Debug().Str("reason", "No session cookie found").Msg("Redirecting to login")
					http.Redirect(w, r, "/login.html", http.StatusFound)
				} else {
					log.Err(err).Msg("Reading cookie")
					response.RenderStatusErr(w, r, http.StatusInternalServerError, err)
				}
				return
			}

			user, session, fresh, err := session.ValidateSessionToken(env, token.Value)
			if err != nil {
				log.Err(err).Msg("Validating session")
				response.RenderStatusErr(w, r, http.StatusInternalServerError, err)
				return
			}

			if user == nil {
				log.Debug().Str("reason", "No valid session found").Msg("Redirecting to login")
				http.Redirect(w, r, "/login.html", http.StatusFound)
				return
			}

			if fresh {
				const thirtyDays = 30 * 24 * 60 * 60
				token.MaxAge = thirtyDays
				http.SetCookie(w, token)
			}

			ctx := user.NewContext(session.NewContext(r.Context()))
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
