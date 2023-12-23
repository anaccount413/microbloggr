// this file is mostly for applying front end changes to do with users
// as well as other things with login
// for example when someone is signing up, makes sure username/password are at least 8 chars


document.addEventListener("DOMContentLoaded", function(){
    let username; 
    let password; 

    // no need to have the check for 8 chars when signing in, as making accounts will be stuck
    // at signup if username/pass is less than 8 chars

    let elems = document.querySelectorAll('body.signup .field input');
    let submit = document.querySelector('body.signup .submitfield input[type="submit"]');

    
    for(let i = 0; i < elems.length; i++){
        elems[i].addEventListener("change", handling);
    }

    // disable submit button if length of input text is less than 8
    let pass_length; 
    let username_length; 
    function handling(event){
        let changed = event.target
        let length = changed.value.length;


        if(changed.name == "name"){
            username_length = length; 
        }
        else{
            pass_length = length;
        }


        if(username_length >= 8 && pass_length >= 8){
            submit.disabled = false;
        }
        else{
            submit.disabled = true;
        }
        
    }
})
