package handlers

import (
	"net/http"

	"github.com/rs/zerolog/log"

	"github.com/mocha8686/iota/response"
)

func CSRF(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "" && r.Method != "GET" {
			origin := r.Header.Get("Origin")

			host := r.Header.Get("X-Forwarded-Host")
			if host == "" {
				host = r.Header.Get("Host")
			}

			if origin == "" || origin != host {
				err := &csrfMismatch{
					origin: origin,
					host:   host,
				}

				log.Warn().Str("origin", origin).Str("host", host).Msg("CSRF mismatch")
				response.RenderStatusErr(w, r, http.StatusForbidden, err)
				return
			}
		}

		next.ServeHTTP(w, r)
	})
}

type csrfMismatch struct {
	origin string
	host   string
}

func (c *csrfMismatch) Error() string {
	return "CSRF mismatch"
}
