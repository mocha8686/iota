package login

import (
	"bufio"
	"context"
	crand "crypto/rand"
	"encoding/base32"
	"fmt"
	"image"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"net/http"
	"os"

	"github.com/kolesa-team/go-webp/encoder"
	"github.com/kolesa-team/go-webp/webp"
	"github.com/oklog/ulid/v2"
	"github.com/rs/zerolog/log"
	"golang.org/x/oauth2"

	"github.com/mocha8686/iota/env"
	"github.com/mocha8686/iota/model"
	"github.com/mocha8686/iota/response"
	"github.com/mocha8686/iota/session"
)

func AuthMiddleware(env *env.Env) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			token, err := r.Cookie("session")
			if err != nil {
				if err == http.ErrNoCookie {
					log.Info().Str("reason", "No session cookie found").Msg("Redirecting to login")
					http.Redirect(w, r, "/login.html", http.StatusFound)
				} else {
					log.Err(err).Msg("Reading cookie")
					response.RenderStatusErr(w, r, http.StatusInternalServerError)
				}
				return
			}

			user, session, fresh, err := session.ValidateSessionToken(env, token.Value)
			if err != nil {
				log.Err(err).Msg("Validating session")
				response.RenderStatusErr(w, r, http.StatusInternalServerError)
				return
			}

			if user == nil {
				log.Info().Str("reason", "No valid session found").Msg("Redirecting to login")
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

func Login(p Provider) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		verifier := oauth2.GenerateVerifier()

		bytes := make([]byte, 12)
		if _, err := crand.Read(bytes); err != nil {
			log.Err(err).Msg("Generating state")
			response.RenderStatusErr(w, r, http.StatusInternalServerError)
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

func Logout(env *env.Env) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		session, ok := model.SessionFromContext(r.Context())
		if !ok {
			http.Redirect(w, r, "/", http.StatusFound)
			return
		}

		if err := env.Sessions.Delete(session.ID); err != nil {
			log.Err(err).Msg("Deleting session during logout")
			response.RenderStatusErr(w, r, http.StatusInternalServerError)
			return
		}
		
		sessionCookie, err := r.Cookie("session")
		if err != nil {
			log.Err(err).Msg("Getting session cookie")
			response.RenderStatusErr(w, r, http.StatusInternalServerError)
			return
		}

		sessionCookie.MaxAge = -1
		http.SetCookie(w, sessionCookie)

		http.Redirect(w, r, "/", http.StatusFound)
	}
}

func Callback(env *env.Env, p Provider) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		state, err := r.Cookie("state")
		if err != nil {
			if err == http.ErrNoCookie {
				log.Warn().Msg("Missing state cookie")
				response.RenderStatusErr(w, r, http.StatusBadRequest)
			} else {
				log.Err(err).Msg("Getting state cookie")
				response.RenderStatusErr(w, r, http.StatusBadRequest)
				return
			}
		}

		remoteState := r.FormValue("state")
		if state.Value != remoteState {
			log.Warn().Str("state", state.Value).Str("remoteState", remoteState).Msg("State mismatch")
			response.RenderStatusErr(w, r, http.StatusBadRequest)
			return
		}

		verifier, err := r.Cookie("verifier")
		if err != nil {
			log.Err(err).Msg("Getting code verifier cookie")
			response.RenderStatusErr(w, r, http.StatusBadRequest)
			return
		}

		token, err := p.Config.Exchange(context.Background(), r.FormValue("code"), oauth2.VerifierOption(verifier.Value))
		if err != nil {
			log.Err(err).Msg("Token exchange")
			response.RenderStatusErr(w, r, http.StatusInternalServerError)
			return
		}

		userInfo, err := p.GetUserInfo(context.Background(), token)
		if err != nil {
			log.Err(err).Msg("Getting user info")
			response.RenderStatusErr(w, r, http.StatusInternalServerError)
			return
		}

		user, err := env.LoginInfoFromAccountInfo(p.Name, userInfo.ID)
		if err != nil {
			log.Err(err).Msg("Getting user from info")
			response.RenderStatusErr(w, r, http.StatusInternalServerError)
			return
		}

		if user == nil {
			ulid := ulid.Make()

			// TODO: store interface?
			if err := os.MkdirAll("avatars", 0755); err != nil {
				log.Err(err).Msg("Creating avatars directory")
				response.RenderStatusErr(w, r, http.StatusInternalServerError)
				return
			}

			res, err := http.Get(userInfo.AvatarURL.String())
			if err != nil {
				log.Err(err).Msg("Getting user avatar")
				response.RenderStatusErr(w, r, http.StatusInternalServerError)
				return
			}
			defer res.Body.Close()

			img, _, err := image.Decode(res.Body)
			if err != nil {
				log.Err(err).Msg("Processing user avatar")
				response.RenderStatusErr(w, r, http.StatusInternalServerError)
				return
			}

			avatarPath := fmt.Sprintf("avatars/%s.webp", ulid)
			file, err := os.Create(avatarPath)
			if err != nil {
				log.Err(err).Msg("Opening avatar file")
				response.RenderStatusErr(w, r, http.StatusInternalServerError)
				return
			}
			defer file.Close()

			opts, err := encoder.NewLossyEncoderOptions(encoder.PresetIcon, 75)
			if err != nil {
				log.Err(err).Msg("Setting webp options")
				response.RenderStatusErr(w, r, http.StatusInternalServerError)
				return
			}

			bw := bufio.NewWriter(file)
			if err := webp.Encode(bw, img, opts); err != nil {
				log.Err(err).Msg("Saving avatar file")
				response.RenderStatusErr(w, r, http.StatusInternalServerError)
				return
			}

			tx, err := env.DB.Begin()
			if err != nil {
				_ = tx.Rollback()
				log.Err(err).Msg("User registration tx")
				response.RenderStatusErr(w, r, http.StatusInternalServerError)
				return
			}

			row := tx.QueryRow("INSERT INTO users (ulid, username) VALUES (?, ?) RETURNING id", ulid.String(), userInfo.Username)
			var id int
			if err := row.Scan(&id); err != nil {
				_ = tx.Rollback()
				log.Err(err).Msg("Inserting new user")
				return
			}

			_, err = tx.Exec("INSERT INTO oauth_accounts (provider_name, external_id, user_id) VALUES (?, ?, ?)", p.Name, userInfo.ID, id)
			if err != nil {
				_ = tx.Rollback()
				log.Err(err).Msg("Inserting new OAuth account")
				response.RenderStatusErr(w, r, http.StatusInternalServerError)
				return
			}

			if err := tx.Commit(); err != nil {
				_ = tx.Rollback()
				log.Err(err).Msg("Committing user registration tx")
				response.RenderStatusErr(w, r, http.StatusInternalServerError)
				return
			}

			user = &model.User{
				ID:       id,
				ULID:     ulid,
				Username: userInfo.Username,
			}
		}

		sessionToken, err := session.GenerateSessionToken()
		if err != nil {
			log.Err(err).Msg("Generating session token")
			response.RenderStatusErr(w, r, http.StatusInternalServerError)
			return
		}

		if err := session.CreateSession(env, sessionToken, user.ID); err != nil {
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
