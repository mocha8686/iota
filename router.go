package main

import (
	"embed"
	_ "embed"
	"fmt"
	"html/template"
	"math/rand/v2"
	"net/http"
	"os"
	"path"
	"strings"

	"github.com/go-chi/chi"
	chiMiddleware "github.com/go-chi/chi/middleware"
	"github.com/rs/zerolog/log"

	"github.com/mocha8686/iota/env"
	"github.com/mocha8686/iota/login"
	"github.com/mocha8686/iota/middleware"
	"github.com/mocha8686/iota/model"
	"github.com/mocha8686/iota/response"
)

func register(r *chi.Mux, env *env.Env) {
	r.Use(chiMiddleware.RequestLogger(&chiMiddleware.DefaultLogFormatter{Logger: &log.Logger, NoColor: false}))
	r.Use(middleware.CSRF)

	r.Route("/app", func(r chi.Router) {
		r.Use(login.AuthMiddleware(env))
		r.Get("/*", fileServer())
	})

	r.Route("/api", func(r chi.Router) {
		r.Get("/rand", randomColor)
		r.Get("/users", env.AllUsers)

		r.Group(func(r chi.Router) {
			r.Use(login.AuthMiddleware(env))
			r.Get("/logout", login.Logout(env))
		})

		for _, provider := range login.Providers {
			name := strings.ToLower(provider.Name)
			r.Get(fmt.Sprintf("/login/%v", name), login.Login(provider))
			r.Get(fmt.Sprintf("/callback/%v", name), login.Callback(env, provider))
		}
	})

	r.Get("/*", fileServer())
}

//go:embed frontend/templates
var templatesFs embed.FS
var templates = template.Must(template.ParseFS(templatesFs, "frontend/templates/*.html"))

func fileServer() http.HandlerFunc {
	handler := func(w http.ResponseWriter, r *http.Request) {
		filePath := path.Clean(path.Join("frontend/dist", r.URL.Path))
		if path.Ext(filePath) == "" {
			filePath = path.Join(filePath, "index.html")
		}

		layout, err := templates.Lookup("layout.html").Clone()
		if err != nil {
			log.Err(err).Msg("Cloning layout template")
			response.RenderStatusErr(w, r, http.StatusInternalServerError)
			return
		}

		page, err := layout.ParseFiles(filePath)
		if err != nil {
			if os.IsNotExist(err) {
				http.NotFound(w, r)
				return
			}
			log.Err(err).Msg("Reading file")
			response.RenderStatusErr(w, r, http.StatusInternalServerError)
			return
		}

		user, _ := model.UserFromContext(r.Context())

		if err := page.ExecuteTemplate(w, "layout", user); err != nil {
			log.Err(err).Msg("Writing layout")
			response.RenderStatusErr(w, r, http.StatusInternalServerError)
			return
		}
	}

	return handler
}

func randomColor(w http.ResponseWriter, rq *http.Request) {
	r, g, b := rand.IntN(255), rand.IntN(255), rand.IntN(255)
	color := fmt.Sprintf("rgb(%v, %v, %v)", r, g, b)

	if err := templates.ExecuteTemplate(w, "header.html", template.CSS(color)); err != nil {
		log.Err(err).Msg("Writing template")
		response.RenderStatusErr(w, rq, http.StatusInternalServerError)
		return
	}
}
