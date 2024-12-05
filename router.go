package main

import (
	"context"
	crand "crypto/rand"
	_ "embed"
	"encoding/base32"
	"fmt"
	"html/template"
	"io"
	"math/rand/v2"
	"net/http"
	"os"
	"path"

	"github.com/go-chi/chi"
	"github.com/go-chi/chi/middleware"
	"github.com/ravener/discord-oauth2"
	"github.com/rs/zerolog/log"
	"golang.org/x/oauth2"

	"github.com/mocha8686/iota/env"
	"github.com/mocha8686/iota/response"
)

func register(r *chi.Mux, env *env.Env) {
	r.Use(middleware.RequestLogger(&middleware.DefaultLogFormatter{Logger: &log.Logger, NoColor: false}))

	r.Get("/", fileServer(""))
	r.Get("/{file}", fileServer(""))

	r.Route("/app", func(r chi.Router) {
		r.Use(authMiddleware)
		r.Get("/", fileServer("app"))
		r.Get("/{file}", fileServer("app"))
	})

	r.Route("/api", func(r chi.Router) {
		r.Get("/rand", randomColor)
		r.Get("/login", discordLogin)
		r.Get("/users", env.AllUsers)
		r.Get("/callback", callback)
	})
}

var conf oauth2.Config = oauth2.Config{
	ClientID:     os.Getenv("DISCORD_CLIENT_ID"),
	ClientSecret: os.Getenv("DISCORD_CLIENT_SECRET"),
	Scopes:       []string{discord.ScopeIdentify},
	Endpoint:     discord.Endpoint,
}

func discordLogin(w http.ResponseWriter, r *http.Request) {
	verifier := oauth2.GenerateVerifier()

	bytes := make([]byte, 12)
	if _, err := crand.Read(bytes); err != nil {
		log.Err(err).Msg("Generating state")
		response.RenderStatusErr(w, r, http.StatusInternalServerError)
		return
	}
	state := base32.StdEncoding.EncodeToString(bytes)
	url := conf.AuthCodeURL(state, oauth2.S256ChallengeOption(verifier))

	const FIFTEEN_MINUTES = 60 * 15

	http.SetCookie(w, &http.Cookie{
		Name: "state",
		Value: state,
		Path: "/",
		MaxAge: FIFTEEN_MINUTES,
		Secure: true,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	})

	http.SetCookie(w, &http.Cookie{
		Name:     "verifier",
		Value:    verifier,
		Path:     "/",
		MaxAge:   FIFTEEN_MINUTES,
		Secure:   true,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	})

	http.Redirect(w, r, url, http.StatusFound)
}

func callback(w http.ResponseWriter, r *http.Request) {
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

	token, err := conf.Exchange(context.Background(), r.FormValue("code"), oauth2.VerifierOption(verifier.Value))
	if err != nil {
		log.Err(err).Msg("Token exchange")
		response.RenderStatusErr(w, r, http.StatusInternalServerError)
		return
	}

	res, err := conf.Client(context.Background(), token).Get("https://discord.com/api/users/@me")
	if err != nil || res.StatusCode != 200 {
		log.Err(err).Msg("Getting user data")
		response.RenderStatusErr(w, r, http.StatusInternalServerError)
		return
	}
	defer res.Body.Close()

	body, err := io.ReadAll(res.Body)
	if err != nil {
		log.Err(err).Msg("Getting user data")
		response.RenderStatusErr(w, r, http.StatusInternalServerError)
		return
	}

	if _, err := w.Write(body); err != nil {
		log.Err(err).Msg("Writing body")
		response.RenderStatusErr(w, r, http.StatusInternalServerError)
		return 
	}
}

func authMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, err := r.Cookie("session")
		if err != nil {
			if err == http.ErrNoCookie {
				log.Info().Msg("Redirect to login")
				http.Redirect(w, r, "/login.html", http.StatusFound)
			} else {
				log.Err(err).Msg("Reading cookie")
				response.RenderStatusErr(w, r, http.StatusInternalServerError)
			}
			return
		}
		next.ServeHTTP(w, r)
	})
}

//go:embed layout.html
var layoutText string
var layout = template.Must(template.New("layout").Parse(layoutText))

func fileServer(prefix string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		filename := chi.URLParam(r, "file")
		log.Debug().Str("filename", filename).Msg("Get file")
		if filename == "" {
			filename = "index.html"
		}

		file, err := os.ReadFile(path.Join("dist", prefix, filename))
		if err != nil {
			log.Err(err).Msg("Reading file")
			response.RenderStatusErr(w, r, http.StatusInternalServerError)
			return
		}

		if err := layout.Execute(w, template.HTML(file)); err != nil {
			log.Err(err).Msg("Writing layout")
			response.RenderStatusErr(w, r, http.StatusInternalServerError)
			return
		}
	}
}

//go:embed templates/header.html
var headerText string
var header = template.Must(template.New("header").Parse(headerText))

func randomColor(w http.ResponseWriter, rq *http.Request) {
	r, g, b := rand.IntN(255), rand.IntN(255), rand.IntN(255)
	color := fmt.Sprintf("rgb(%v, %v, %v)", r, g, b)

	if err := header.Execute(w, template.CSS(color)); err != nil {
		log.Err(err).Msg("Writing template")
		response.RenderStatusErr(w, rq, http.StatusInternalServerError)
		return
	}
}
