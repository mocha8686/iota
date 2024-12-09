-- +goose Up
-- +goose StatementBegin
CREATE UNIQUE INDEX idx_users_ulid ON users(ulid);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP INDEX idx_users_ulid;
-- +goose StatementEnd
