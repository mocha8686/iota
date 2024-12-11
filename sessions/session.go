package sessions

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base32"
	"encoding/hex"
	"net/http"
	"time"

	"github.com/mocha8686/iota/env"
	"github.com/mocha8686/iota/model"
)

func GenerateSessionToken() (string, error) {
	bytes := make([]byte, 20)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	token := base32.StdEncoding.EncodeToString(bytes)
	return token, nil
}

func CalculateSessionID(token string) string {
	hashedBytes := sha256.Sum256([]byte(token))
	sessionID := hex.EncodeToString(hashedBytes[:])
	return sessionID
}

func CreateSession(env *env.Env, token string, userID int) error {
	const thirtyDays = time.Hour * 24 * 30

	sessionID := CalculateSessionID(token)
	session := model.Session{
		ID:        sessionID,
		ExpiresAt: time.Now().Add(thirtyDays),
		UserID:    userID,
	}

	if err := env.Sessions.Insert(session); err != nil {
		return err
	}

	return nil
}

func ValidateSessionToken(env *env.Env, token string) (*model.User, *model.Session, bool, error) {
	sessionID := CalculateSessionID(token)
	user, session, err := env.Sessions.Get(sessionID)
	if err != nil {
		return nil, nil, false, err
	}

	if user == nil || session == nil {
		return nil, nil, false, nil
	}

	if time.Now().After(session.ExpiresAt) {
		if err := env.Sessions.Delete(session.ID); err != nil {
			return nil, nil, false, err
		}
		return nil, nil, false, nil
	}

	fresh := false
	daysRemaining := time.Until(session.ExpiresAt).Hours() / 24
	if daysRemaining < 15 {
		fresh = true
		const thirtyDays = time.Hour * 24 * 30
		session.ExpiresAt = session.ExpiresAt.Add(thirtyDays)

		_, err := env.DB.Exec(
			"UPDATE sessions SET expires_at = ? WHERE id = ?",
			session.ExpiresAt.Unix(),
			session.ID,
		)
		if err != nil {
			return nil, nil, false, err
		}
	}

	return user, session, fresh, nil
}

func DeleteSessionCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     "session",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		Secure:   true,
		HttpOnly: true,
	})
}
