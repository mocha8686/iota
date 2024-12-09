package model

import (
	"context"
	"database/sql"
	"time"

	"github.com/oklog/ulid/v2"
)

type Session struct {
	ID        string
	ExpiresAt time.Time
	UserID    int
}

type sessionKeyType int
var sessionKey sessionKeyType

func (s *Session) NewContext(ctx context.Context) context.Context {
	return context.WithValue(ctx, sessionKey, s)
}

func SessionFromContext(ctx context.Context) (*Session, bool) {
	s, ok := ctx.Value(sessionKey).(*Session)
	return s, ok
}

type SessionEnv struct {
	db *sql.DB
}

func NewSessionEnv(db *sql.DB) SessionEnv {
	return SessionEnv{
		db: db,
	}
}

func (e SessionEnv) Get(id string) (*User, *Session, error) {
	query := `
SELECT s.id, s.expires_at, u.id, u.ulid, u.username
FROM sessions s
JOIN users u ON s.user_id = u.id
WHERE s.id = ?
`
	row := e.db.QueryRow(query, id)

	var session Session
	var expiresAtSecs int64
	var user User
	var ulidStr string
	if err := row.Scan(&session.ID, &expiresAtSecs, &user.ID, &ulidStr, &user.Username); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil, nil
		}
		return nil, nil, err
	}

	ulid, err := ulid.Parse(ulidStr)
	if err != nil {
		return nil, nil, err
	}

	user.ULID = ulid

	session.UserID = user.ID
	session.ExpiresAt = time.Unix(expiresAtSecs, 0)

	return &user, &session, nil
}

func (e SessionEnv) Insert(session Session) error {
	_, err := e.db.Exec(
		"INSERT INTO sessions (id, expires_at, user_id) VALUES (?, ?, ?)",
		session.ID,
		session.ExpiresAt.Unix(),
		session.UserID,
	)

	return err
}

func (e SessionEnv) Delete(id string) error {
	_, err := e.db.Exec("DELETE FROM sessions WHERE id = ?", id)
	return err
}

