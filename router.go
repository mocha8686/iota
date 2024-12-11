package main

import (
	_ "embed"
	"fmt"
	"html/template"
	"math/rand/v2"
	"net/http"
	"strings"

	"github.com/go-chi/chi"
	chiMiddleware "github.com/go-chi/chi/middleware"
	"github.com/rs/zerolog/log"

	"github.com/mocha8686/iota/auth"
	"github.com/mocha8686/iota/auth/providers"
	"github.com/mocha8686/iota/env"
	"github.com/mocha8686/iota/handlers"
	"github.com/mocha8686/iota/response"
)

func register(r *chi.Mux, env *env.Env, templates *template.Template) {
	r.Use(chiMiddleware.RequestLogger(&chiMiddleware.DefaultLogFormatter{Logger: &log.Logger, NoColor: false}))
	r.Use(handlers.CSRF)

	r.Route("/app", func(r chi.Router) {
		r.Use(handlers.AuthMiddleware(env))
		r.Use(chiMiddleware.Compress(5, "text/html", "text/css", "text/javascript"))
		r.Get("/*", handlers.TemplateServer(templates))
	})

	r.Route("/api", func(r chi.Router) {
		r.Get("/rand", randomColor(templates))
		r.Get("/users", env.AllUsers)

		r.Group(func(r chi.Router) {
			r.Use(handlers.AuthMiddleware(env))
			r.Get("/logout", auth.Logout(env))
		})

		for _, provider := range providers.Providers {
			name := strings.ToLower(provider.Name)
			r.Get(fmt.Sprintf("/login/%v", name), auth.Login(provider))
			r.Get(fmt.Sprintf("/callback/%v", name), auth.Callback(env, provider))
		}
	})

	staticFS := http.StripPrefix("/static", http.FileServer(http.Dir("frontend/static")))
	r.Get("/static/*", staticFS.ServeHTTP)

	r.Group(func(r chi.Router) {
		r.Use(chiMiddleware.Compress(5, "text/html", "text/css", "text/javascript"))
		r.Get("/*", handlers.TemplateServer(templates))
	})
}

func randomColor(templates *template.Template) http.HandlerFunc {
	return func(w http.ResponseWriter, rq *http.Request) {
		r, g, b := rand.IntN(255), rand.IntN(255), rand.IntN(255)
		color := fmt.Sprintf("rgb(%v, %v, %v)", r, g, b)

		if err := templates.ExecuteTemplate(w, "header.html", template.CSS(color)); err != nil {
			log.Err(err).Msg("Writing template")
			response.RenderStatusErr(w, rq, http.StatusInternalServerError, err)
			return
		}
	}
}
