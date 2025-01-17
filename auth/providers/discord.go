package providers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"

	"github.com/ravener/discord-oauth2"
	"golang.org/x/oauth2"
)

var Discord Provider = Provider{
	Name: "Discord",
	Config: oauth2.Config{
		ClientID:     os.Getenv("DISCORD_CLIENT_ID"),
		ClientSecret: os.Getenv("DISCORD_CLIENT_SECRET"),
		Scopes:       []string{discord.ScopeIdentify},
		Endpoint:     discord.Endpoint,
	},
	Icon:          "simple-icons:discord",
	FetchUserInfo: fetchDiscordUserInfo,
	FetchUsername: fetchDiscordUsername,
}

type discordUserInfo struct {
	ID         string `json:"id"`
	Username   string `json:"username"`
	AvatarHash string `json:"avatar"`
}

func fetchDiscordUserInfo(c *http.Client) (UserInfo, error) {
	res, err := c.Get("https://discord.com/api/v10/users/@me")
	if err != nil || res.StatusCode != http.StatusOK {
		if err != nil {
			err = fmt.Errorf("%v", res.StatusCode)
		}
		return UserInfo{}, fmt.Errorf("Getting Discord user info: %w", err)
	}
	defer res.Body.Close()

	body, err := io.ReadAll(res.Body)
	if err != nil {
		return UserInfo{}, fmt.Errorf("Reading Discord user info: %w", err)
	}

	var data discordUserInfo
	if err := json.Unmarshal(body, &data); err != nil {
		return UserInfo{}, fmt.Errorf("Unmarshalling Discord user info: %w", err)
	}

	avatarURL := url.URL{
		Scheme:   "https",
		Host:     "cdn.discordapp.com",
		Path:     fmt.Sprintf("/avatars/%s/%s.webp", data.ID, data.AvatarHash),
		RawQuery: "size=512",
	}

	userInfo := UserInfo{
		ID:        data.ID,
		Username:  data.Username,
		AvatarURL: &avatarURL,
	}

	return userInfo, nil
}

type discordUsername struct {
	Username string `json:"username"`
}

func fetchDiscordUsername(id string) (string, error) {
	res, err := http.Get(fmt.Sprintf("https://discord.com/api/v10/users/%s", id))
	if err != nil || res.StatusCode != http.StatusOK {
		if err != nil {
			err = fmt.Errorf("%v", res.StatusCode)
		}
		return "", fmt.Errorf("Getting Discord username: %w", err)
	}
	defer res.Body.Close()

	body, err := io.ReadAll(res.Body)
	if err != nil {
		return "", fmt.Errorf("Reading Discord user info: %w", err)
	}

	var data discordUsername
	if err := json.Unmarshal(body, &data); err != nil {
		return "", fmt.Errorf("Unmarshalling Discord username: %w", err)
	}

	return data.Username, nil
}
