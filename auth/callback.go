package auth

import (
	"context"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"net/http"

	"github.com/rs/zerolog/log"
	"golang.org/x/oauth2"

	"github.com/mocha8686/iota/auth/providers"
	"github.com/mocha8686/iota/env"
	"github.com/mocha8686/iota/response"
	"github.com/mocha8686/iota/sessions"
)

func Callback(env *env.Env, p providers.Provider) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		statusErr := verifyState(r)
		if statusErr != nil {
			_ = statusErr.Render(w, r)
			return
		}

		token, statusErr := getToken(r, p)
		if statusErr != nil {
			_ = statusErr.Render(w, r)
			return
		}

		userInfo, err := p.GetUserInfo(context.Background(), token)
		if err != nil {
			log.Err(err).Msg("Getting user info")
			response.RenderStatusErr(w, r, http.StatusInternalServerError, err)
			return
		}

		user, err := env.LoginInfoFromAccountInfo(p.Name, userInfo.ID)
		if err != nil {
			log.Err(err).Msg("Getting user from info")
			response.RenderStatusErr(w, r, http.StatusInternalServerError, err)
			return
		}

		if user == nil {
			user, err = registerUser(env, p, userInfo)
			if err != nil {
				log.Err(err).Msg("Registering user")
				response.RenderStatusErr(w, r, http.StatusInternalServerError, err)
				return
			}
		}

		sessionToken, err := sessions.GenerateSessionToken()
		if err != nil {
			log.Err(err).Msg("Generating session token")
			response.RenderStatusErr(w, r, http.StatusInternalServerError, err)
			return
		}

		if err := sessions.CreateSession(env, sessionToken, user.ID); err != nil {
			log.Err(err).Msg("Creating session")
			return
		}

		const thirtyDays = 30 * 24 * 60 * 60
		http.SetCookie(w, &http.Cookie{
			Name:     "session",
			Value:    sessionToken,
			Path:     "/",
			MaxAge:   thirtyDays,
			Secure:   true,
			HttpOnly: true,
			SameSite: http.SameSiteLaxMode,
		})

		http.SetCookie(w, &http.Cookie{
			Name:     "state",
			Path:     "/api/callback",
			MaxAge:   -1,
			Secure:   true,
			HttpOnly: true,
			SameSite: http.SameSiteLaxMode,
		})

		http.SetCookie(w, &http.Cookie{
			Name:     "verifier",
			MaxAge:   -1,
			Secure:   true,
			HttpOnly: true,
			SameSite: http.SameSiteLaxMode,
		})

		http.Redirect(w, r, "/app", http.StatusFound)
	}
}

func getToken(r *http.Request, p providers.Provider) (*oauth2.Token, *response.StatusErr) {
	verifier, err := r.Cookie("verifier")
	if err != nil {
		log.Err(err).Msg("Getting code verifier cookie")
		return nil, response.NewStatusErr(http.StatusBadRequest, err)
	}

	token, err := p.Config.Exchange(context.Background(), r.FormValue("code"), oauth2.VerifierOption(verifier.Value))
	if err != nil {
		log.Err(err).Msg("Token exchange")
		return nil, response.NewStatusErr(http.StatusInternalServerError, err)
	}

	return token, nil
}

type stateError struct {
	local  string
	remote string
}

func (s *stateError) Error() string {
	return "State mismatch"
}

func verifyState(r *http.Request) *response.StatusErr {
	state, err := r.Cookie("state")
	if err != nil {
		log.Warn().Msg("Missing state cookie")
		return response.NewStatusErr(http.StatusBadRequest, err)
	}

	remoteState := r.FormValue("state")
	if state.Value != remoteState {
		log.Warn().Str("state", state.Value).Str("remoteState", remoteState).Msg("State mismatch")
		return response.NewStatusErr(
			http.StatusBadRequest,
			&stateError{
				local:  state.Value,
				remote: remoteState,
			},
		)
	}

	return nil
}
