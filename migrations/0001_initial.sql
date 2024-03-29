create table following (
  id text,
  params text,
  seen boolean default (1),
  since datetime default (datetime('now','localtime'))
);
create unique index index_following_id on following (id);

create table follower (
  id text,
  params text,
  seen boolean default (1),
  since datetime default (datetime('now','localtime'))
);
create unique index index_follower_id on follower (id);
