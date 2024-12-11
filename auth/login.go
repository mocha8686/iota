package auth

import (
	"crypto/rand"
	"encoding/base32"
	"net/http"

	"github.com/rs/zerolog/log"
	"golang.org/x/oauth2"

	"github.com/mocha8686/iota/auth/providers"
	"github.com/mocha8686/iota/response"
)

func Login(p providers.Provider) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		verifier := oauth2.GenerateVerifier()

		bytes := make([]byte, 12)
		if _, err := rand.Read(bytes); err != nil {
			log.Err(err).Msg("Generating state")
			response.RenderStatusErr(w, r, http.StatusInternalServerError, err)
			return
		}
		state := base32.StdEncoding.EncodeToString(bytes)
		url := p.Config.AuthCodeURL(state, oauth2.S256ChallengeOption(verifier))

		const fifteenMinutes = 60 * 15

		http.SetCookie(w, &http.Cookie{
			Name:     "state",
			Value:    state,
			Path:     "/api/callback",
			MaxAge:   fifteenMinutes,
			Secure:   true,
			HttpOnly: true,
			SameSite: http.SameSiteLaxMode,
		})

		http.SetCookie(w, &http.Cookie{
			Name:     "verifier",
			Value:    verifier,
			Path:     "/api/callback",
			MaxAge:   fifteenMinutes,
			Secure:   true,
			HttpOnly: true,
			SameSite: http.SameSiteLaxMode,
		})

		http.Redirect(w, r, url, http.StatusFound)
	}
}
