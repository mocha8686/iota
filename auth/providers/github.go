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
	Icon:          "simple-icons:github",
	FetchUserInfo: fetchGithubUserInfo,
	FetchUsername: fetchGithubUsername,
}

type githubUserInfo struct {
	ID        int    `json:"id"`
	Username  string `json:"login"`
	AvatarURL string `json:"avatar_url"`
}

func fetchGithubUserInfo(c *http.Client) (UserInfo, error) {
	req, err := http.NewRequest("GET", "https://api.github.com/user", nil)
	if err != nil {
		return UserInfo{}, fmt.Errorf("Setting up Github request: %w", err)
	}
	req.Header.Add("X-GitHub-Api-Version", "2022-11-28")

	res, err := c.Do(req)
	if err != nil || !(res.StatusCode == http.StatusOK || res.StatusCode == http.StatusNotModified) {
		if err != nil {
			err = fmt.Errorf("%v", res.StatusCode)
		}
		return UserInfo{}, fmt.Errorf("Getting Github user info: %w", err)
	}
	defer res.Body.Close()

	body, err := io.ReadAll(res.Body)
	if err != nil {
		return UserInfo{}, fmt.Errorf("Reading Github user info: %w", err)
	}

	var data githubUserInfo
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

type githubUsername struct {
	Username string `json:"login"`
}

func fetchGithubUsername(id string) (string, error) {
	res, err := http.Get(fmt.Sprintf("https://api.github.com/user/%s", id))
	if err != nil || !(res.StatusCode == http.StatusOK || res.StatusCode == http.StatusNotModified) {
		if err != nil {
			err = fmt.Errorf("%v", res.StatusCode)
		}
		return "", fmt.Errorf("Getting Github username: %w", err)
	}
	defer res.Body.Close()

	body, err := io.ReadAll(res.Body)
	if err != nil {
		return "", fmt.Errorf("Reading Github username: %w", err)
	}

	var data githubUsername
	if err := json.Unmarshal(body, &data); err != nil {
		return "", fmt.Errorf("Unmarshalling Github username: %w", err)
	}

	return data.Username, nil
}
