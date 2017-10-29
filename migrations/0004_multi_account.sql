create table dummy_account (
  email text,
  username text,
  password text,
  name text,
  created_at datetime default (datetime('now','localtime'))
);
create unique index index_dummy_account_username on dummy_account (username);
create unique index index_dummy_account_email on dummy_account (email);
