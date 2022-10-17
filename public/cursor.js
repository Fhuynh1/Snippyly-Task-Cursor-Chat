// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.12.1/firebase-app.js';
import { getDatabase, ref, set, update, onValue, serverTimestamp, push, get} from 'https://www.gstatic.com/firebasejs/9.12.1/firebase-database.js';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: 'AIzaSyBX8-MynIHSLhXHPLCuK8eS4Q47W_IlYRs',
    authDomain: 'cursor-chat.firebaseapp.com',
    databaseURL: 'https://cursor-chat-default-rtdb.firebaseio.com',
    projectId: 'cursor-chat',
    storageBucket: 'cursor-chat.appspot.com',
    messagingSenderId: '450567428716',
    appId: '1:450567428716:web:572c03ff34144ae18c5649',
    measurementId: 'G-CE4CZ37RRN'
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase();

const chatBubble = document.createElement('textarea');
chatBubble.className = 'textbox';
chatBubble.id = 'chatBubble'
chatBubble.style.display = 'none';
chatBubble.value = '';
document.getElementById('body').appendChild(chatBubble);

// Create a unique user ID to differentiate between users             
const userID = push(ref(database,'users/')).key;

// List to keep track of other users' cursors to prevent re-adding them
const cursorAdded = [];

function generateUser(){
    set(ref(database, 'users/' + userID), {
        cursorCordX: 0,
        cursorCordY: 0,
        timeLastMoved: serverTimestamp(),
    });
}

function updateCursorCordinates(event){
    update(ref(database, 'users/' + userID), {
        cursorCordX: event.pageX,
        cursorCordY: event.pageY,
        timeLastMoved: serverTimestamp()
    });
    chatBubble.style.left = event.pageX + 20 +'px';
    chatBubble.style.top = event.pageY + 20 +'px';
}

function backSlashPressed(event){
    var chat = document.getElementById('chatbubble');
    if(event.keyCode === 92){
        if(chatBubble.style.display === 'none'){
            event.preventDefault();
            chatBubble.style.display = 'block';
            document.getElementById('chatBubble').focus();
    }
    else{
        chatBubble.style.display = 'none';
        chatBubble.value = '';
        chatBubble.style.height = '35px';
        update(ref(database, 'users/' + userID), {
            chatMessage: '',
        });
        }
    }
}

function typingInChatBubble(event){
    chatBubble.style.height = chatBubble.scrollHeight + 'px';
    update(ref(database, 'users/' + userID), {
        chatMessage: event.target.value,
    });
}

function updateOtherChatBubble(element, message, xCord, yCord){
    element.value = message;
    element.style.left = xCord + 20 + 'px';
    element.style.top = yCord+ 20 + 'px';

    element.style.height = element.scrollHeight + 'px';
    if(message){
        element.style.display = 'block';
    }
    else{
        element.style.display = 'none';
    }
    
}

function updateOtherUsers(){
    onValue(ref(database, 'users/'), (snapshot) => {
        for (var [key, value] of Object.entries(snapshot.val())){
            // Prevent showing own cursor 
            if (key !== userID && Math.abs(Date.now() - value['timeLastMoved']) < 60000){
                if(cursorAdded.includes(key) === false){
                    // Show cursor
                    let cursorImage = document.createElement('img');
                    cursorImage.id = key;
                    cursorImage.style.position = 'absolute';
                    cursorImage.src = 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Mouse_pointer_small.png';
                    cursorImage.style.left = value['cursorCordX']+ 'px';
                    cursorImage.style.top = value['cursorCordY']+ 'px';
                    document.getElementById('body').appendChild(cursorImage);
                    cursorAdded.push(key);

                    // Show chat bubbles
                    let otherChatBubble = document.createElement('textarea');
                    otherChatBubble.className = 'textbox';
                    otherChatBubble.id = 'chatBubble'+key
                    otherChatBubble.disabled = true;
                    updateOtherChatBubble(otherChatBubble, value['chatMessage'], value['cursorCordX'], value['cursorCordY']);

                    document.getElementById('body').appendChild(otherChatBubble);

                }   
                else{
                    if(cursorAdded.includes(key) === true){
                    // Update cursor
                    let otherCursor = document.getElementById(key);
                    otherCursor.style.left = value['cursorCordX'] + 'px';
                    otherCursor.style.top = value['cursorCordY']+ 'px';

                    // Update chat bubbles
                    updateOtherChatBubble(document.getElementById('chatBubble'+key), value['chatMessage'], value['cursorCordX'], value['cursorCordY']);
                    
                    }
                    
                }
            }
        }
    });
    
}

function removeInactiveCursors(){
    get(ref(database, 'users/')).then((snapshot) => {
        for (var [key, value] of Object.entries(snapshot.val()) ){
            if(key !== userID && Math.abs(Date.now() - value['timeLastMoved']) >= 60000 & cursorAdded.includes(key) === true){
                if(document.getElementById(key) !== null){
                    document.getElementById(key).remove();
                }
                if(document.getElementById('chatBubble'+key) !== null){
                    document.getElementById('chatBubble'+key).remove();
                }
                //remove from cursorAdded
                const index = cursorAdded.indexOf(key);
                if (index > -1) { // only splice array when item is found
                    cursorAdded.splice(index, 1); // 2nd parameter means remove one item only
                }
            }
        }
    });
}

generateUser();
updateOtherUsers();
document.addEventListener('keypress', backSlashPressed);
document.addEventListener('input', typingInChatBubble);
document.addEventListener('mousemove', updateCursorCordinates);
// Remove other cursors that have been inactive for a 1 minute after every 3 seconds
window.setInterval(removeInactiveCursors, 3000);
