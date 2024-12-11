package providers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strconv"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"
)

var Github Provider = Provider{
	Name: "GitHub",
	Config: oauth2.Config{
		ClientID:     os.Getenv("GITHUB_CLIENT_ID"),
		ClientSecret: os.Getenv("GITHUB_CLIENT_SECRET"),
		Scopes:       []string{},
		Endpoint:     github.Endpoint,
	},
	FetchUserInfo: fetchGithubUserInfo,
}

type githubResponse struct {
	ID        int    `json:"id"`
	Username  string `json:"login"`
	AvatarURL string `json:"avatar_url"`
}

func fetchGithubUserInfo(c *http.Client) (UserInfo, error) {
	req, err := http.NewRequest("GET", "", nil)
	if err != nil {
		return UserInfo{}, fmt.Errorf("Setting up Github request: %w", err)
	}
	req.Header.Add("X-GitHub-Api-Version", "2022-11-28")

	res, err := c.Do(req)
	if err != nil || !(res.StatusCode == http.StatusOK || res.StatusCode == http.StatusNotModified) {
		return UserInfo{}, fmt.Errorf("Getting Github uesr info: %w", err)
	}
	defer res.Body.Close()

	body, err := io.ReadAll(res.Body)
	if err != nil {
		return UserInfo{}, fmt.Errorf("Reading Github user info: %w", err)
	}

	var data githubResponse
	if err := json.Unmarshal(body, &data); err != nil {
		return UserInfo{}, fmt.Errorf("Unmarshalling Github user info: %w", err)
	}

	avatarURL, err := url.Parse(data.AvatarURL)
	if err != nil {
		return UserInfo{}, fmt.Errorf("Parsing avatar URL: %w", err)
	}

	userInfo := UserInfo{
		ID:        strconv.Itoa(data.ID),
		Username:  data.Username,
		AvatarURL: avatarURL,
	}

	return userInfo, nil
}
