package response

import (
	"net/http"

	"github.com/go-chi/render"
	"github.com/rs/zerolog/log"
)

type StatusErr struct {
	Code int
}

func NewStatusErr(code int) *StatusErr {
	return &StatusErr{
		Code: code,
	}
}

func RenderStatusErr(w http.ResponseWriter, r *http.Request, code int) {
	e := NewStatusErr(http.StatusInternalServerError)
	if err := render.Render(w, r, e); err != nil {
		log.Err(err).Msg("Rendering status error")
	}
}

func (e *StatusErr) Render(w http.ResponseWriter, r *http.Request) error {
	http.Error(w, http.StatusText(e.Code), e.Code)
	return nil
}
