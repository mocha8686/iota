package model

import (
	"context"
	"database/sql"
	"errors"

	"github.com/oklog/ulid/v2"
)

type User struct {
	ID       int
	ULID     ulid.ULID
	Username string
}

type userKeyType int
var userKey userKeyType

func (u *User) NewContext(ctx context.Context) context.Context {
	return context.WithValue(ctx, userKey, u)
}

func UserFromContext(ctx context.Context) (*User, bool) {
	u, ok := ctx.Value(userKey).(*User)
	return u, ok
}

type UserEnv struct {
	db *sql.DB
}

func NewUserEnv(db *sql.DB) UserEnv {
	return UserEnv{
		db: db,
	}
}

func (e UserEnv) Get(id int) (*User, error) {
	row := e.db.QueryRow("SELECT id, ulid, username FROM users WHERE id = ?", id)

	var user User
	var ulidStr string
	if err := row.Scan(&user.ID, &ulidStr, &user.Username); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	ulid, err := ulid.Parse(ulidStr)
	if err != nil {
		return nil, err
	}
	user.ULID = ulid

	return &user, nil
}

func (e UserEnv) ByULID(ulid ulid.ULID) (*User, error) {
	row := e.db.QueryRow("SELECT id, username FROM users WHERE ulid = ?", ulid.String())

	var user User
	if err := row.Scan(&user.ID, &user.Username); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	user.ULID = ulid

	return &user, nil
}

func (e UserEnv) All() ([]User, error) {
	rows, err := e.db.Query("SELECT id, ulid, username FROM users")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []User

	for rows.Next() {
		var user User
		var ulidStr string

		if err := rows.Scan(&user.ID, &ulidStr, &user.Username); err != nil {
			return nil, err
		}

		ulid, err := ulid.Parse(ulidStr)
		if err != nil {
			return nil, err
		}
		user.ULID = ulid

		users = append(users, user)
	}

	if err := rows.Err(); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	return users, nil
}
