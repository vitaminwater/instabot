create table unfollowed (
  id text,
  params text,
  at datetime default (datetime('now','localtime'))
);
create unique index index_unfollowed_id on unfollowed (id);
