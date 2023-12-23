// this file is mostly for applying more general front end alterations
// for example the underline on the currently active page for the nav bar


document.addEventListener("DOMContentLoaded", function(){
    // will highlight the navbar page that is active
    // navbar only shows on pages that have links on it
    // as other pages are signin/signout and 
    let navbar_elems = document.querySelectorAll('.links li');
    let current_active = document.querySelector("li.link.active");
    // goal is the first few items in path
    // possible active paths will be "/", "/makepost", "/yourposts"
    let current_path = window.location.href;
    

    let final_path = 0;
    
    for(let i = 0; i < current_path.length; i++){
        if(current_path[i] == '/'){
            final_path = i; 
        }
    }
    let end_path = final_path + 1; 
    for(let i = final_path; i < current_path.length; i++){
        if(current_path[i] == '?'){
            end_path = i;
            break;
        }
        else{
            end_path = current_path.length;
        }
    }

    let the_path = current_path.slice(final_path, end_path);

    for(let i = 0; i < navbar_elems.length; i++){
       
        if(navbar_elems[i].textContent == " Make Post" && the_path == '/makepost'){
           current_active.classList.remove('active');
           navbar_elems[i].classList.add('active');
           break;
        }
        else if(navbar_elems[i].textContent == " Your Posts" && the_path == "/yourposts"){
            current_active.classList.remove('active');
            navbar_elems[i].classList.add('active');
            break;
         }
        else if(navbar_elems[i].textContent == " All Posts" && the_path == "/"){
            current_active.classList.remove('active');
            navbar_elems[i].classList.add('active');
            break;
        }
        
    }

    
})