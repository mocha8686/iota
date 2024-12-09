-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS users (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	ulid TEXT NOT NULL UNIQUE,
	username TEXT NOT NULL UNIQUE,
	CHECK(2 <= length(username) and length(username) <= 256)
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE users;
-- +goose StatementEnd
