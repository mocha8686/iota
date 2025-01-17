package model

import (
	"database/sql"
	"errors"
)

type Account struct {
	ProviderName string
	ExternalID   string
	UserID       int
}

type AccountEnv struct {
	db *sql.DB
}

type AccountMap map[string]Account

func NewAccountEnv(db *sql.DB) AccountEnv {
	return AccountEnv{
		db: db,
	}
}

func (a AccountEnv) AllOfUser(userID int) (AccountMap, error) {
	rows, err := a.db.Query("SELECT provider_name, external_id FROM oauth_accounts WHERE user_id = ?", userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	defer rows.Close()

	accounts := make(AccountMap)

	for rows.Next() {
		var account Account

		if err := rows.Scan(&account.ProviderName, &account.ExternalID); err != nil {
			return nil, err
		}

		account.UserID = userID
		accounts[account.ProviderName] = account
	}

	if err := rows.Err(); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	return accounts, nil
}
