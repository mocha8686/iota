package handlers

import (
	"html/template"
	"net/http"
	"os"
	"path"

	"github.com/rs/zerolog/log"

	"github.com/mocha8686/iota/model"
	"github.com/mocha8686/iota/response"
)

func TemplateServer(templates *template.Template) http.HandlerFunc {
	handler := func(w http.ResponseWriter, r *http.Request) {
		filePath := path.Clean(path.Join("frontend/dist", r.URL.Path))
		if path.Ext(filePath) == "" {
			filePath = path.Join(filePath, "index.html")
		}

		layout, err := templates.Lookup("layout.html").Clone()
		if err != nil {
			log.Err(err).Msg("Cloning layout template")
			response.RenderStatusErr(w, r, http.StatusInternalServerError, err)
			return
		}

		page, err := layout.ParseFiles(filePath)
		if err != nil {
			if os.IsNotExist(err) {
				http.NotFound(w, r)
				return
			}
			log.Err(err).Msg("Reading file")
			response.RenderStatusErr(w, r, http.StatusInternalServerError, err)
			return
		}

		user, _ := model.UserFromContext(r.Context())

		w.Header().Set("Content-Type", "text/html")

		if err := page.ExecuteTemplate(w, "layout", user); err != nil {
			log.Err(err).Msg("Writing layout")
			response.RenderStatusErr(w, r, http.StatusInternalServerError, err)
			return
		}
	}

	return handler
}
