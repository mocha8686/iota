package login

import (
	"context"
	"net/http"
	"net/url"

	"golang.org/x/oauth2"
)

type UserInfo struct {
	ID        string
	Username  string
	AvatarURL *url.URL
}

type Provider struct {
	Name          string
	Config        oauth2.Config
	FetchUserInfo func(*http.Client) (UserInfo, error)
}

func (p Provider) GetUserInfo(context context.Context, token *oauth2.Token) (UserInfo, error) {
	client := p.Config.Client(context, token)
	return p.FetchUserInfo(client)
}

var Providers []Provider = []Provider{Discord, Github}
