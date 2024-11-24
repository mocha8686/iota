package model

import (
	"database/sql"
)

type User struct {
	Id       int
	Username string
}

type UserEnv struct {
	db *sql.DB
}

func NewUserEnv(db *sql.DB) UserEnv {
	return UserEnv{
		db: db,
	}
}

func (e UserEnv) All() ([]User, error) {
	rows, err := e.db.Query("SELECT * FROM users")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []User

	for rows.Next() {
		var user User

		if err := rows.Scan(&user.Id, &user.Username); err != nil {
			return nil, err
		}

		users = append(users, user)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return users, nil
}
