-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS sessions (
	id TEXT PRIMARY KEY,
	expires_at INTEGER NOT NULL,
	user_id INTEGER NOT NULL REFERENCES user(id)
);

CREATE TABLE IF NOT EXISTS oauth_accounts (
	provider_name TEXT NOT NULL,
	external_id TEXT NOT NULL,
	user_id INTEGER NOT NULL REFERENCES users(id),
	PRIMARY KEY (provider_name, external_id)
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE sessions;
DROP TABLE oauth_accounts;
-- +goose StatementEnd
