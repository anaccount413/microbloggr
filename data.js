const mysql = require(`mysql-await`); 


var connPool = mysql.createPool({
  connectionLimit: 5, 
  host: "cse-mysql-classes-01.cse.umn.edu",// this will work
  user: "C4131F23U144",
  database: "C4131F23U144",
  password: "moha_213_232"
});


// this will take in a username and password 
// and add the user to the database
async function addUser(info){
    let params = [info.name, info.password];
    return (connPool.awaitQuery("INSERT into user(username, pass) VALUES(?, ?);", params));
}

// this will take in the post content, username of the person who made the post
//  likes on post is defaulted to 0
// server manually gives the user
// so this does two queries, getting the user id for the given username 
// and inserting the post
async function addPost(info){
  let userID = await connPool.awaitQuery("SELECT user_id FROM user where username=?;", info.username);
  let params = [info.post_content, userID[0].user_id]; 
  return (connPool.awaitQuery("INSERT into post(content, user_id) VALUES(?, ?);", params));
  
}

// this will return the hashed password for a given username
// comparison will be done in the server
async function checkUserInfo(info){
  let params = [info]
  return (connPool.awaitQuery("SELECT pass FROM user WHERE username=?;", params))
}

// checks if username in database, barrier to signup as usernames should be uniques
async function checkUserName(info){
  let params = [info]
  console.log(params);
  return (connPool.awaitQuery("SELECT COUNT(*) as is_present FROM user where username=?;", params))
}


// all the queries to get posts (next 4 functions) will return a table 
// where column 1 is the username, column 2 is the post, column 3 is the number of likes, column 4 is the post id


// will just return all posts in reverse temporal order
async function getAllRecentPosts(){
  return (connPool.awaitQuery("SELECT username, content, likes, post_id FROM user INNER JOIN post ON post.user_id = user.user_id ORDER BY post_time desc"));
}



// will return all posts in order by descending likes
async function getAllLikedPosts(){
  return (connPool.awaitQuery("SELECT username, content, likes, post_id FROM user INNER JOIN post ON post.user_id = user.user_id ORDER BY likes desc"));
}

// will return posts for a specific user
// takes in the username
async function getUsersPostsRecent(info){
  return (connPool.awaitQuery("SELECT username, content, likes, post_id FROM user INNER JOIN post ON post.user_id = user.user_id AND user.username=? ORDER BY post_time desc", info));

}

async function getUsersPostsLiked(info){
  return (connPool.awaitQuery("SELECT username, content, likes, post_id FROM user INNER JOIN post ON post.user_id = user.user_id AND user.username=? ORDER BY likes desc", info));
}

// takes in post id , updates like field in post to increase by 1 and increases total post likes for user
async function likePost(info){
  await (connPool.awaitQuery("UPDATE post SET likes = likes + 1 WHERE post_id = ?", info.post_id));
  
  // this will update the post_likes field for the user to be equal to the sum of all their post likes
  return (connPool.awaitQuery("UPDATE user SET post_likes = (SELECT SUM(post.likes) FROM post WHERE post.user_id = user.user_id) WHERE user.username = ?;", info.username));
}

// takes in edited post body and the post id, updates the post content
async function updatePost(info){
  let params = [info.post_content, info.post_id];

  return (connPool.awaitQuery("UPDATE post SET content = ? where post_id = ?", params));
}

// deletes a post with given user ID
async function deletePost(id){
  return (connPool.awaitQuery("DELETE from post where post_id=?", id))

}


// gets up to 3 most recent posts, first 20 chars
async function getThree(){
  return (connPool.awaitQuery("SELECT SUBSTRING(content, 1, 20) as content from post where likes >= 1 ORDER BY likes desc LIMIT 3;"))
}

// gets the total number of likes a user has across posts
// makes sure value is up to date beforehand
async function getLikes(username){

  await connPool.awaitQuery("UPDATE user SET post_likes = COALESCE((SELECT SUM(post.likes) FROM post WHERE post.user_id = user.user_id), 0) WHERE user.username = ?", username);
  return (connPool.awaitQuery("SELECT post_likes from user WHERE username=?", username));
}

module.exports = {addUser, getLikes, addPost, deletePost, checkUserInfo, checkUserName, getAllRecentPosts, getAllLikedPosts, getUsersPostsLiked, getUsersPostsRecent, likePost, updatePost, getThree};