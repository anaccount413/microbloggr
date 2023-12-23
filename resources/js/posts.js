// this file is for front end changes with the posts
// for example deleted posts being taken off immediately

// will need database query here
// specifically for select items


document.addEventListener("DOMContentLoaded", function(){

    // there are a few times where the page has some larger html changes to the post area
    // after being rerendered through a fetch request
    // this function centralizes it into one call

    async function changePostArea(res){
        // to be replaced
        let orig_post = document.querySelector('.postarea');

        // get the rendered html from the response
        let html_res = await res.text(); 

        // put the html in a container and get the post area
        let container = document.createElement('div');
        container.innerHTML = html_res;
        let altered_posts = container.querySelector('.postarea')
        let other_orig = orig_post.innerHTML;


        // replace the post area
        orig_post.innerHTML = altered_posts.innerHTML;

        // remove the temp container
        container.remove()
    }

    // sometimes when a lot of html gets replaced, event listeners are also taken off for the buttons
    // this will put event listeners for the correct handlers back
    async function addListeners(){
        let like_buttons = document.querySelectorAll(".postarea .likebutton")
        let edit_buttons = document.querySelectorAll(".postarea .editbutton")
        let delete_buttons = document.querySelectorAll(".postarea .deletebutton")



        for(let i = 0; i < like_buttons.length; i++){
            like_buttons[i].addEventListener("click", likeHandler);
        }

        for(let i = 0; i < edit_buttons.length; i++){
            edit_buttons[i].addEventListener("click", editHandler);
        }

        for(let i = 0; i < delete_buttons.length; i++){
            delete_buttons[i].addEventListener("click", deleteHandler);
        }
    }

    



    // first is detecting changes in the dropdown
    // if a change is made, will change display
    // this is done through direct html replacement
    // so basically, dynamic templating is used to generate the page at first
    // however, changes in the dropdown will lead to an event listener being called
    // which will call fetch to a post in the server, which will send re-rendered pug 
    // with the new order, which will be directly replacing the previous ordering


    // when users are logged in and on their posts page wanting to sort, 
    // the way to get the username will be from getting the content of the "user" sidebar element
    // since req.session items are not in here

    // just getting the path 
    // will use to determine the user post page sorting
    let current_path = window.location.href;
    let final_path = 0;
    for(let i = 0; i < current_path.length; i++){
        if(current_path[i] == '/'){
            final_path = i; 
        }
    }
    let end_path = final_path + 1; 
    let the_query;
    for(let i = final_path; i < current_path.length; i++){
        if(current_path[i] == '?'){
            end_path = i;
            // get page number if there, page number if only query that matters 
            // if page number is not correctly in query then it will be ignored for security
            if(current_path.slice(end_path + 1, end_path + 6) == "page="){
                the_query = current_path.slice(end_path + 6, current_path.length);
            }
            
            break;
        }
        else{
            end_path = current_path.length;
        }
    }
    let the_path = current_path.slice(final_path, end_path);
    let the_path_w_query = current_path.slice(final_path, current_path.length);


    let select = document.querySelector(".sortingby");
    

    select.addEventListener("change", selectHandler);

    let response;
     
    
    async function selectHandler(event){

        // fetches gets response of re-rendered pug, puts into temporary container and 
        // gets the postarea part of the html, sets the original rendered html to the 
        // new altered html
        // then removes the temporary container from dom
        // only difference in conditions is what is fetched
        // user vs main page sorting by likes is a nested conditional in the outer conditional checking which dropdown value
        // is being used
        
        if(event.target.value == "Likes"){
            if(the_path == "/yourposts"){
                response = await fetch('/likeduserposts', {
                    method: "POST", 
                    
                })

                await changePostArea(response);
            }
            else{
                response = await fetch('/likedposts', {
                    method: "POST", 
                   
                })

                await changePostArea(response);
            }
        }

        else if(event.target.value == "Most Recent"){
            
            if(the_path == "/yourposts"){
                response = await fetch('/recentuserposts', {
                    method: "POST", 
                    
                })

                await changePostArea(response);
            }

            else{
                response = await fetch('/recentposts', {
                    method: "POST", 
                    
                })

                await changePostArea(response);
            }
            
        }
        await addListeners();
    }

    // next is handling deletes/edits/likes to posts
    // delete will send a delete request and remove the post from server and frontend 
    // edit will change the post format to include a text box for the post to be edited
    // like will increase post likes in database and change the like number

    // need to add event listeners to all buttons

    // specific posts will be identified by their parent post id
    let like_buttons = document.querySelectorAll(".postarea .likebutton")
    let edit_buttons = document.querySelectorAll(".postarea .editbutton")
    let delete_buttons = document.querySelectorAll(".postarea .deletebutton")



    for(let i = 0; i < like_buttons.length; i++){
        like_buttons[i].addEventListener("click", likeHandler);
    }

    for(let i = 0; i < edit_buttons.length; i++){
        edit_buttons[i].addEventListener("click", editHandler);
    }

    for(let i = 0; i < delete_buttons.length; i++){
        delete_buttons[i].addEventListener("click", deleteHandler);
    }

    async function likeHandler(event){
        // the parent element id is the post id with a prefix string
        // ids are like post_(post id )
        // also get the username of the post
        let parent_id = parseInt(event.target.parentNode.id.slice(5, event.target.parentNode.id.length));
        let post_username = event.target.parentNode.parentNode.childNodes[0];

        // send a fetch that will send the post information
        // and will update the page to reflect the new like
        let bodyelem = {
            post_id: parent_id,
            username: post_username.textContent.slice(1, post_username.textContent.length)
        };

        response = await fetch('/posts/like', {
            method: "POST", 
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(bodyelem)
        });

        let likeCount = document.querySelector(`#${event.target.parentNode.id} .likecount`);

        // in form like (x likes) take out the x

        let end_num = 0;
        for(let i = 0; i < likeCount.textContent.length; i++){
            if(isNaN(parseInt(likeCount.textContent[i]))){
                end_num = i;
                break;
            }
        }
        
        let actualLikeCount = parseInt(likeCount.textContent.slice(0, end_num));
        

        if(actualLikeCount == 0){
            likeCount.textContent = (actualLikeCount + 1) + " like"
        }

        else{
            likeCount.textContent = (actualLikeCount + 1) + " likes"
        }
        
    }

    // edit will change the box with the text to being alterable and also replace the like area with a submit button
    // that submit button will have an event listener which will send the update to the database
    async function editHandler(event){
        let parent_id = parseInt(event.target.parentNode.id.slice(5, event.target.parentNode.id.length));
        let actualPostBox = event.target.parentNode.parentNode;

        let bodyelem = {
            post_id: parent_id
        };

        // the parent of the parent of the button holds the container for the like items, post content, and username
        // only has one class "actualpost"
        let body = actualPostBox.childNodes[1];
        let the_edit_box = `<div class = "tempform">
                                <form action="/posts/updatepost" method="post">
                                    <textarea name="post_content" maxlength="100" placeholder="Write your post here..."> ${body.textContent}</textarea> 
                                    <input type="hidden" name="post_id" value="${parent_id}">
                                    <div><input type="submit" value="Send Post" /> </div>  
                                </form>
                            </div>`
        
        // the text content is the 2nd child element of the actual post box
        // temporarily replace this
        let old_elem = actualPostBox.childNodes[1];
        let orig_likestuff = actualPostBox.childNodes[2];
        actualPostBox.removeChild(orig_likestuff);

        // use temp div to get form as a node
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = the_edit_box;

        // Extract the form element from the temp
        let form = tempDiv.firstElementChild;

        // add form as child to post box
        actualPostBox.replaceChild(form, old_elem);

        // fetch to avoid reload
        let the_form = document.querySelector(`.${actualPostBox.classList[0]} form`);

        the_form.addEventListener("submit", submitHandler);

        let new_text; 
        async function submitHandler(event){
            new_text = document.querySelector(`.${actualPostBox.classList[0]} textarea`).value;
            // check for updated post length here if the max length was gotten past
            if(new_text.length > 100){
                return;
            }
            event.preventDefault(); // this will prevent the default action for the form (going to the /posts/updatepost endpoint) from occuring
            let formdata = new FormData(the_form);

            // convert to json object for sending as body
            let bodyElem = {};

            formdata.forEach((value, key)=>{
                bodyElem[key] = value;
            })

            let response = await fetch("/posts/updatepost", {
                method: "POST", 
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(bodyElem)
            })
            // after that is completed, change elems back to how they were before the textarea
            old_elem.textContent = new_text;
            actualPostBox.replaceChild(old_elem, form);
            actualPostBox.appendChild(orig_likestuff);
            document.removeChild(tempDiv);

        }
    }

    // this will delete the item from the front end
    // and send the request to delete the item from the database
    async function deleteHandler(event){
        // dom is like 
        // overall_postarea holds all posts
        // outer container of individual post
        // individual post box
        // individual post content
        // individual post button
        let overall_post = event.target.parentNode.parentNode.parentNode.parentNode;
        let individual_post = event.target.parentNode.parentNode.parentNode;
        let p_id = parseInt(event.target.parentNode.id.slice(5, event.target.parentNode.id.length));

        // send request to delete
        if(the_query == undefined){
            the_query = 1;
        }
        let bodyElem = {
            post_id: p_id,
            a_path: the_path,
            page_num: parseInt(the_query)
        }
        let response = await fetch("/posts/deletepost", {
            method: "DELETE", 
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(bodyElem)
        })

        if(response.status == 404 || response.status == 200){
            // take the re-rendered page and display it
            
            await changePostArea(response);
            await addListeners();
        }


    }


})