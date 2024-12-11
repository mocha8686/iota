package auth

import (
	"bufio"
	"fmt"
	"image"
	"net/http"
	"os"

	"github.com/kolesa-team/go-webp/encoder"
	"github.com/kolesa-team/go-webp/webp"
	"github.com/oklog/ulid/v2"

	"github.com/mocha8686/iota/auth/providers"
	"github.com/mocha8686/iota/env"
	"github.com/mocha8686/iota/model"
)

func registerUser(env *env.Env, p providers.Provider, userInfo providers.UserInfo) (*model.User, error) {
	ulid := ulid.Make()

	if err := os.MkdirAll("avatars", 0755); err != nil {
		return nil, fmt.Errorf("Creating avatars directory: %w", err)
	}

	if err := getAvatar(userInfo.AvatarURL.String(), ulid.String()); err != nil {
		return nil, fmt.Errorf("Getting user avatar: %w", err)
	}

	tx, err := env.DB.Begin()
	if err != nil {
		_ = tx.Rollback()
		return nil, fmt.Errorf("User registration tx: %w", err)
	}

	row := tx.QueryRow("INSERT INTO users (ulid, username) VALUES (?, ?) RETURNING id", ulid.String(), userInfo.Username)
	var id int
	if err := row.Scan(&id); err != nil {
		_ = tx.Rollback()
		return nil, fmt.Errorf("Inserting new user: %w", err)
	}

	_, err = tx.Exec("INSERT INTO oauth_accounts (provider_name, external_id, user_id) VALUES (?, ?, ?)", p.Name, userInfo.ID, id)
	if err != nil {
		_ = tx.Rollback()
		return nil, fmt.Errorf("Inserting new OAuth account: %w", err)
	}

	if err := tx.Commit(); err != nil {
		_ = tx.Rollback()
		return nil, fmt.Errorf("Committing user registration tx: %w", err)
	}

	user := &model.User{
		ID:       id,
		ULID:     ulid,
		Username: userInfo.Username,
	}
	return user, nil
}

func getAvatar(avatarURL, ulidStr string) error {
	res, err := http.Get(avatarURL)
	if err != nil {
		return fmt.Errorf("Avatar request: %w", err)
	}
	defer res.Body.Close()

	img, _, err := image.Decode(res.Body)
	if err != nil {
		return fmt.Errorf("Decoding avatar image: %w", err)
	}

	opts, err := encoder.NewLossyEncoderOptions(encoder.PresetIcon, 75)
	if err != nil {
		return fmt.Errorf("Initializing webp encoder: %w", err)
	}

	// TODO: avatar store interface?
	avatarPath := fmt.Sprintf("avatars/%s.webp", ulidStr)
	file, err := os.Create(avatarPath)
	if err != nil {
		return fmt.Errorf("Creating avatar file: %w", err)
	}
	defer file.Close()

	bw := bufio.NewWriter(file)
	if err := webp.Encode(bw, img, opts); err != nil {
		return fmt.Errorf("Saving avatar: %w", err)
	}

	return nil
}
