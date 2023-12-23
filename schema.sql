-- generate user table
-- each user has a username, id, password, likes on posts associated with account
-- and likes given from account
-- username could have been set as unique to make sure no duplicates, however this is already checked
-- in the server when accounts are generated. Passwords being unique would be risky because if someone
-- got stopped when making a non-unique password, it would then be known that some account has that
-- password, which is a security issue
create table user(
    user_id int not null auto_increment, 
    username text not null, 
    pass text not null, 
    post_likes int not null default 0, 
    given_likes int not null default 0,
    primary key(user_id)
);

-- add a user

("INSERT into user(username, pass) VALUES(?, ?);", params)

-- get user password
("SELECT pass FROM user WHERE username=?;", params)


-- check if username is in database
("SELECT COUNT(*) as is_present FROM user where username=?;", params)

-- get total user likes
("SELECT post_likes from user WHERE username=?", username)

-- update user likes from post table
("UPDATE user SET post_likes = COALESCE((SELECT SUM(post.likes) FROM post WHERE post.user_id = user.user_id), 0) WHERE user.username = ?", username)


-- generate posts table
-- each post has a content, associated user id, post time, position id, and number of likes associated with it
create table post(
    post_id int not null auto_increment,
    content text not null, 
    likes int default 0, 
    post_time timestamp not null default CURRENT_TIMESTAMP,
    user_id int not null,
    primary key(post_id), 
    foreign key(user_id) references user(user_id)

);
-- add a post
("INSERT into post(content, user_id) VALUES(?, ?);", params)

-- get Recent Posts for user
("SELECT username, content, likes, post_id FROM user INNER JOIN post ON post.user_id = user.user_id AND user.username=? ORDER BY post_time desc", info)

-- get liked posts for user
("SELECT username, content, likes, post_id FROM user INNER JOIN post ON post.user_id = user.user_id AND user.username=? ORDER BY likes desc", info)

-- get recent posts for all
"SELECT username, content, likes, post_id FROM user INNER JOIN post ON post.user_id = user.user_id ORDER BY post_time desc"

-- get liked post for all
"SELECT username, content, likes, post_id FROM user INNER JOIN post ON post.user_id = user.user_id ORDER BY likes desc"

-- get first 20 chars of 3 most liked posts
"SELECT SUBSTRING(content, 1, 20) as content from post where likes >= 1 ORDER BY likes desc LIMIT 3;"

-- delete post
("DELETE from post where post_id=?", id)

-- update post 
("UPDATE post SET content = ? where post_id = ?", params)

-- like post 
("UPDATE post SET likes = likes + 1 WHERE post_id = ?", info.post_id)

