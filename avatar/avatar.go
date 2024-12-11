package avatar

import (
	"fmt"
	"net/http"

	"github.com/oklog/ulid/v2"
	"github.com/rs/zerolog/log"

	"github.com/mocha8686/iota/env"
	"github.com/mocha8686/iota/model"
	"github.com/mocha8686/iota/response"
)

func ULIDToAvatarPath(u ulid.ULID) string {
	return fmt.Sprintf("avatars/%s.webp", u.String())
}

func GetCurrentAvatar(env *env.Env) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		user, ok := model.UserFromContext(r.Context())
		if !ok {
			response.RenderStatusErr(w, r, http.StatusUnauthorized, nil)
		}

		ServeAvatar(w, r, user.ULID)
	}
}

func GetAvatar(w http.ResponseWriter, r *http.Request) {
	ulidStr := r.PathValue("ulid")
	u, err := ulid.ParseStrict(ulidStr)
	if err != nil {
		log.Err(err).Str("ulid", ulidStr).Msg("Getting avatar")
		response.RenderStatusErr(w, r, http.StatusBadRequest, err)
	}
	ServeAvatar(w, r, u)
}

func ServeAvatar(w http.ResponseWriter, r *http.Request, u ulid.ULID) {
	path := ULIDToAvatarPath(u)
	http.ServeFile(w, r, path)
}
