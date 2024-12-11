package response

import (
	"net/http"

	"github.com/go-chi/render"
	"github.com/rs/zerolog/log"
)

type StatusErr struct {
	Code int
	Err  error
}

func NewStatusErr(code int, err error) *StatusErr {
	return &StatusErr{
		Code: code,
		Err:  err,
	}
}

func RenderStatusErr(w http.ResponseWriter, r *http.Request, code int, err error) {
	e := NewStatusErr(http.StatusInternalServerError, err)
	if err := render.Render(w, r, e); err != nil {
		log.Err(err).Msg("Rendering status error")
	}
}

func (e *StatusErr) Render(w http.ResponseWriter, r *http.Request) error {
	http.Error(w, http.StatusText(e.Code), e.Code)
	return nil
}
