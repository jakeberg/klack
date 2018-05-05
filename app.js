const express = require('express');
const mongoose = require('mongoose');
const querystring = require('querystring');
const port = 3000;
const app = express();

app.use(express.static("./public"));
app.use(express.json());

const messageSchema = mongoose.Schema({
    sender: String,
    message: String,
    timestamp: Number
});

const Message = mongoose.model('Message', messageSchema)

let messages = [];
// Track last active times for each sender
let users = {};
let lastActive = {};

Message.find({}, function (err, messageList) {
    if (err) return handleError(err)

    for (let i in messageList) {
        messages.push(messageList[i])
    }
});

function userSortFn(a, b) {
    var nameA = a.name.toUpperCase(); // ignore upper and lowercase
    var nameB = b.name.toUpperCase(); // ignore upper and lowercase
    if (nameA < nameB) {
        return -1;
    }
    if (nameA > nameB) {
        return 1;
    }

    // names must be equal
    return 0;
};

app.get("/messages", (request, response) => {
    const now = Date.now();
    const requireActiveSince = now - (15 * 1000) // consider inactive after 15 seconds

    //Old code for user activity:

    // usersSimple = Object.keys(users).map((x) => ({
    //     name: x,
    //     active: (users[x] > requireActiveSince)
    // }))
    // usersSimple.sort(userSortFn);
    // usersSimple.filter((a) => (a.name !== request.query.for))
    // users[request.query.for] = now;


    Message.find({}, function (err, messageList) {
        if (err) return handleError(err)
        let lastTime
        for (let i in messageList) {
            let lastTime = messageList[i].timestamp
            let sender = messageList[i].sender
            if(lastActive[i] == undefined){
                lastActive[sender] = lastTime
            }
        }
        usersNew = Object.keys(lastActive).map((x) => ({
            name: x,
            active: (lastActive[x] > requireActiveSince)
        }))
        usersNew.sort(userSortFn);
        console.log("usersNew:", usersNew)
        response.send({
            messages: messages.slice(-40),
            // users: usersSimple,
            active: usersNew
        })
    });
});

app.post("/messages", (request, response) => {
    let incomingMessage = request.body.message
    let sender = request.body.sender
    let timestamp = Date.now()
    let newMessage = new Message({
        message: incomingMessage,
        sender: sender,
        timestamp: timestamp
    })

    newMessage.save(function (err, newMessage) {
        if (err) return console.error(err);
    })

    // add a timestamp to each incoming message.
    request.body.timestamp = timestamp
    messages.push(request.body)
    users[request.body.sender] = timestamp
    response.status(201)
    response.send(request.body)
});

app.listen(3000, () => mongoose.connect('mongodb://localhost/klack'));