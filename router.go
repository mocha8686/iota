package main

import (
	_ "embed"
	"fmt"
	"html/template"
	"math/rand/v2"
	"net/http"
	"path"
	"strings"

	"github.com/go-chi/chi"
	chiMiddleware "github.com/go-chi/chi/middleware"
	"github.com/rs/zerolog/log"

	"github.com/mocha8686/iota/auth"
	"github.com/mocha8686/iota/auth/providers"
	"github.com/mocha8686/iota/avatar"
	"github.com/mocha8686/iota/env"
	"github.com/mocha8686/iota/handlers"
	"github.com/mocha8686/iota/response"
)

func FS(p string) http.HandlerFunc {
	localDir := path.Join("frontend", p)
	prefix := path.Join("/", p)
	FS := http.StripPrefix(prefix, http.FileServer(http.Dir(localDir)))
	return FS.ServeHTTP
}

func register(r *chi.Mux, env *env.Env, templates *template.Template) {
	compress := chiMiddleware.Compress(5)
	getSession := handlers.GetSession(env)
	templateServer := handlers.TemplateServer(templates)

	r.Use(chiMiddleware.RequestLogger(&chiMiddleware.DefaultLogFormatter{Logger: &log.Logger, NoColor: false}))
	r.Use(handlers.CSRF)

	r.Route("/app", func(r chi.Router) {
		r.Use(getSession)
		r.Use(compress)
		r.Get("/*", templateServer)
	})

	r.Route("/api", func(r chi.Router) {
		r.Get("/rand", randomColor(templates))
		r.Get("/users", env.AllUsers)

		r.Group(func(r chi.Router) {
			r.Use(getSession)
			r.Get("/logout", auth.Logout(env))
		})

		r.Route("/avatar", func(r chi.Router) {
			r.Get("/{ulid}", avatar.GetAvatar)
			r.Group(func(r chi.Router) {
				r.Use(getSession)
				r.Get("/", avatar.GetCurrentAvatar(env))
			})
		})

		r.Group(func(r chi.Router) {
			r.Use(handlers.CheckForSession)
			for _, provider := range providers.Providers {
				name := strings.ToLower(provider.Name)
				r.Get(fmt.Sprintf("/login/%v", name), auth.Login(provider))
				r.Get(fmt.Sprintf("/callback/%v", name), auth.Callback(env, provider))
			}
		})
	})

	r.Get("/static/*", FS("static"))
	r.Get("/favicon.ico", FS("static"))

	r.Group(func(r chi.Router) {
		r.Use(compress)

		r.Get("/assets/*", FS("assets"))

		r.Group(func(r chi.Router) {
			r.Use(handlers.CheckForSession)
			r.Get("/*", templateServer)
		})
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
