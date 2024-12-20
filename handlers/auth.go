package handlers

import (
	"errors"
	"net/http"

	"github.com/rs/zerolog/log"

	"github.com/mocha8686/iota/env"
	"github.com/mocha8686/iota/response"
	"github.com/mocha8686/iota/sessions"
)

func GetSession(env *env.Env) func(next http.Handler) http.Handler {
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

			user, session, fresh, err := sessions.ValidateSessionToken(env, token.Value)
			if err != nil {
				log.Err(err).Msg("Validating session")
				response.RenderStatusErr(w, r, http.StatusInternalServerError, err)
				return
			}

			if user == nil {
				sessions.DeleteSessionCookie(w)
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

func CheckForSession(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		session, err := r.Cookie("session")
		if err == nil || !errors.Is(err, http.ErrNoCookie) {
			if err != nil {
				log.Err(err).Msg("Checking for session cookie at login")
				response.RenderStatusErr(w, r, http.StatusInternalServerError, err)
			} else {
				log.Info().Msg("Already logged in, redirecting to app")
				http.Redirect(w, r, "/app", http.StatusFound)
			}
			return
		}

		if session != nil && session.Value != "" {
			log.Info().Msg("Already logged in, redirecting to app")
			http.Redirect(w, r, "/app", http.StatusFound)
		}

		next.ServeHTTP(w, r)
	})
}
