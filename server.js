const data = require("./data")
const express = require('express')
const session = require('express-session')
const bcrypt = require('bcrypt')
const app = express()
const port = 4131

// set up pug rendering
app.set("views", "templates");
app.set("view engine", "pug");


// middleware for parsing form data and json
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// this allows for get requests to the items in here resolve
// since it uses resource folder, it checks for items in resource folder
// like /css/main.css or /js/posts.js
app.use(express.static('resources'))

app.use(session({secret:"jakbsdjabeuwhfjksnxjkncm,sdnlalokqiojurfb"}))

// will use session variables to track invalid signin/signup attempts
// this will be helpful with dynamically generating helpful messages after invalid attempts

// middleware to set the session variables for invalid signin/signup attempts to false
const setInvalidSignIn = (req, res, next)=>{
    if(req.path != "/signin"){
        req.session.invalid_signin = false;
    }
    next();
}

const setInvalidSignUp = (req, res, next)=>{
    if(req.path != "/signup"){
        req.session.invalid_signup = false;
    }
    next();
}

app.use(setInvalidSignIn);
app.use(setInvalidSignUp);

// there are several endpoints which use the same logic (for the post pages)
// they mainly differ in what kind of SELECT is used, so this function kind of centralizes the code to avoid repetition and 
// returns the params needed to generate the pug page 

// recent and user are booleans representing if the post is user posts only/recent or liked sorted
async function getPostPageParams(req, user, recent){
    // if the query is there then parse and get the int, otherwise 1
    let page_number = req.query.page ? parseInt(req.query.page) : 1;


    start_index = (page_number - 1) * 5; 

    // even if there aren't 5 elements for the page, .slice will handle it and just get however many there are
    end_index = start_index + 5; 

    // these activity/username parameters will help with dynamically generating the username on the screen when accounts are signed in
    let input_params;
    input_params = {activity: false, username: ""};
    let y;

    // session still available even when fetch requests don't automatically send it
    // because of same-origin requests
    if(recent){
        if(user){
            y = await data.getUsersPostsRecent(req.session.username);
        }
        else{
            y = await data.getAllRecentPosts(); 
        }
    }
    else{
        if(user){
            y = await data.getUsersPostsLiked(req.session.username);
        }
        else{
            y = await data.getAllLikedPosts();
        }
    }
   

    // keep track of final page since that only has a previous link
    let final_page = parseInt(y.length / 5); 
    let remainder = y.length % 5; 
    if(remainder > 0){
        final_page = parseInt(y.length / 5) + 1;
    }

    // get posts for current page
    input_params.posts = y.slice(start_index, end_index); 

    // set the page numbers which will be checked in pug
    input_params.current_page = page_number;
    input_params.final_page = final_page;

    // trending posts for dynamically generating the rows for that table

    input_params.trending = (await data.getThree());
    if(req.session.username){
        input_params.username = req.session.username;
        input_params.activity = true;
    }

    input_params.path = req.path;

    return input_params;

}

// another function for getting rid of some code repetition
// for pages gotten with fetch, there might be some issues with the previous page number
// for example if a fetch request is sent to post /recentuserposts from page 2 of /yourposts it will have page number 1 
// with page '/' when what is wanted is still the same page 2 of /yourposts but in a different order
// this function changes that

function getPage(param){
    let refer = param.get('Referer')
    let page;
    
    if(refer.includes('?')){ 
        // since the referer is a string, manually parse out the page param
        // returns list of items before/after split, get the after split

        let query = refer.split("?")[1];

        if(query.slice(0, 5) != "page=" || isNaN(parseInt(query.slice(5, query.length)))){
            return false;
        }
        page = parseInt(query.slice(5, query.length))
    }

    return page;

}



app.get("/", async (req, res)=>{

    let param = req;
    // for the base page the default is recent posts with all posts displayed
    let x = await getPostPageParams(param, false, true);

    // mainly to help with rerendering the page in order with delete
    // since recent/user endpoints inherently have their ordering preference, while delete doesn't 
    req.session.recent = true;

    res.status(200).render("basepage.pug", {active: x});
})

// for both signin and signup, the invalid attempt session variables will
// be for generating helpful messages upon failure to signin/signup
app.get('/signin', (req, res)=>{
    let pug_params = {attempt: req.session.invalid_signin};
    res.status(200).render("signin.pug", {params: pug_params});
})

app.get('/signup', (req, res)=>{
    let pug_params = {attempt: req.session.invalid_signup};
    res.status(200).render("signup.pug", {params: pug_params});
})

// generating a post requires users to be signed in, otherwise, they will
// be forced to go to the signin page
app.get('/makepost', async (req, res)=>{
    if(req.session.username){
        res.status(200).render("post.pug")
    }
    else{
        res.status(401).redirect('/signin');
    }
   
})

// the signout page will end the current session
// if there is no logged in session going on, the button will simply not be there
app.get('/signout', (req, res)=>{
    if(req.session.username){
        req.session.destroy(error=>{
            if(error){
                console.log("Error logging out")
                res.send("Error logging out")
            }
            else{
                res.render("signout.pug")
            }
        })
    }

    else{
        res.status(401).redirect('/signin');
    }
   
})

// this will send the account statistics page for signed in users
app.get('/account', async (req, res)=>{
    if(req.session.username){
        let x = await data.getLikes(req.session.username);
        // only one item is there, since the select is only for one user
        res.status(200).render("account.pug", {parameter: x[0]});
    }

    else{
        res.status(401).redirect('/signin')
    }
    
})

// this will get the posts a logged in user has made, if not logged in
// it will redirect to signin page
app.get("/yourposts", async (req, res)=>{
    if(req.session.username){
        
        let param = req;
        // for the yourposts page the default is recent posts with user posts displayed
        let x = await getPostPageParams(param, true, true);
        res.status(200).render("basepage.pug", {active: x}); 
        req.session.recent = true;
    }

    else{
        res.status(401).redirect('/signin');
    }
    
})

// this is for handling posts that are submitted
app.post('/submitpost', async (req, res)=>{
    let post = req.body;
    // check to make sure post body is <=100 chars
    if(post.length > 100){
        res.status(404).redirect('/yourposts')
    }

    post.username = req.session.username; 
    let x = await data.addPost(post);
    res.status(200).redirect('/yourposts');
})

// this is for handling the signup form
app.post('/signup', async (req, res)=>{
    let items = req.body; 
    let x = await data.checkUserName(items.name);

    // if a user tries to access the signup page while logged in, they will be logged out
    if(req.session.username){
        return res.redirect('/signout');
    }


    // will use session variables to keep track of invalid attempts to signin/signup
    if(x[0].is_present > 0){
        req.session.invalid_signup = true; 
        return res.status(200).redirect('/signup');
    }
    
    else{
        req.session.invalid_signup = false;
        let hashedpass = await bcrypt.hash(items.password, 10);
        items.password = hashedpass;
        await data.addUser(items);
        req.session.username = items.name;
    }
    

    // redirect to mainpage once signup successful
    res.status(200).redirect('/');
})

// there will be no way to access this endpoint again if one used
// the signup endpoint 
app.post('/signin', async (req, res)=>{
    let items = req.body; 

    // if a user tries to access the signin page while logged in, but they will be logged out
    if(req.session.username){
        return res.redirect('/signout');
    }

    if(!req.session.username){
        let x = await data.checkUserInfo(items.name);

        // empty set means select didn't find a matching account
        if(x.length == 0){
           req.session.invalid_signin = true; 
            // immediately exit after redirect to avoid error
            return res.status(200).redirect('/signin')
        }
        else{
            let pass = x[0].pass;
            let is_pass = await bcrypt.compare(items.password, pass);

            if(is_pass){
                req.session.username = items.name;
                req.session.invalid_signin = false; 
            }
            else{
                req.session.invalid_signin = true; 
                // immediately exit after redirect to avoid error
                return res.status(200).redirect('/signin');
            }
           
            
        }
    }
    //redirect to mainpage once signin successful
    res.status(200).redirect('/')
})

// these will be called with the fetch requests in posts.js
app.post('/recentposts', async (req, res)=>{
    // recent all posts is false for user true for recent
    let param = req;
    
    let page_num = getPage(param);
    

    if(page_num == false){
        res.status(404).render("404.pug");
        return;
    }

    req.session.recent = true;

    param.query.page = page_num;

    let y = await getPostPageParams(param, false, true);

    res.status(200).render("basepage.pug", {active: y});
})

app.post('/likedposts', async (req, res)=>{
    // liked all posts is false for user false for recent
    
    let param = req;
    let page_num = getPage(param);
    

    if(page_num == false){
        res.status(404).render("404.pug");
        return;
    }

    req.session.recent = false;

    param.query.page = page_num;

    let y = await getPostPageParams(param, false, false);

    res.status(200).render("basepage.pug", {active: y});
})

app.post('/recentuserposts', async (req, res)=>{

    // recent user posts is true for user true for recent
    let param = req;
    
    let page_num = getPage(param);

    req.session.recent = true;
    

    if(page_num == false){
        res.status(404).render("404.pug");
        return;
    }

    param.query.page = page_num;

    let y = await getPostPageParams(param, true, true);
    res.status(200).render("basepage.pug", {active: y});

})

app.post('/likeduserposts', async (req, res)=>{
    
    // liked user posts is true for user false for recent
    let param = req;

    let page_num = getPage(param);

    req.session.recent = false;
    

    if(page_num == false){
        res.status(404).render("404.pug");
        return;
    }

    param.query.page = page_num;

    let y = await getPostPageParams(param, true, false);
    res.status(200).render("basepage.pug", {active: y});
})

// not as much change in html, just in the number of likes elem
app.post('/posts/like', async (req, res)=>{
    let like_param = req.body;

    let x = await data.likePost(like_param);
    if(x.affectedRows > 0){
        res.status(200).type('text/plain').send("Successfully liked post");
    }
    else{
        res.status(404).type('text/plain').send("Did not like post");
    }

})

// this will delete the post from the database
app.post('/posts/updatepost', async (req, res)=>{
    // make sure that > 100 char posts still 404
    if(req.body.post_content.length > 100){
        res.status(404).type("text/plain").send("Too long for a post");
        return;
    }
    let params = req.body;
    data.updatePost(params);
    res.status(200).type('text/plain').send("Successfully updated");
})

// this will delete the post and re-render the page to reflect the deletion
app.delete('/posts/deletepost', async (req, res)=>{
    let x = await data.getAllLikedPosts();
    let postID = req.body.post_id; 
    let user_logged = false;
    if(req.body.a_path == "/yourposts"){
        user_logged = true;
    }
    req.query.page = req.body.page_num;

    let param = req; 
    
    let y = await data.deletePost(postID);
    let input = await getPostPageParams(param, user_logged, req.session.recent);

    if(y.affectedRows > 0){
         res.status(200).render("basepage.pug", {active: input});
    }
    else{
        res.status(404).type('text/plain').send("Failed to delete post");
    }


})


app.use((req, res, next) => {
    res.status(404).render("404.pug");
});

app.listen (port , () => {
    console.log(`Server on port ${port}`)
})