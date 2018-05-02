const express = require('express')
const mongoose = require('mongoose')
const querystring = require('querystring');
const port = 3000
const app = express()

const messageSchema = mongoose.Schema({
    sender: String,
    message: String,
    timestamp: Number
});

const Message = mongoose.model('Message', messageSchema)

let messages = [];
// Track last active times for each sender
let users = {}

app.use(express.static("./public"))
app.use(express.json())

Message.find({}, 'sender message timestamp', function (err, messageList) {
    if (err) return handleError(err)

    // console.log('Message List', messageList)
  
    for(let i in messageList) {
        // console.log('Should be an object:', messageList[i]);
        messages.push(messageList[i])
        // users.push(messageList[i].sender)
    }
})

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
}

app.get("/messages", (request, response) => {
    const now = Date.now();
    const requireActiveSince = now - (15 * 1000) // consider inactive after 15 seconds
    usersSimple = Object.keys(users).map((x) => ({
        name: x,
        active: (users[x] > requireActiveSince)
    }))
    usersSimple.sort(userSortFn);
    usersSimple.filter((a) => (a.name !== request.query.for))
    users[request.query.for] = now;
    console.log(users)
    response.send({
        messages: messages.slice(-40),
        users: usersSimple
    })

})

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
})

app.listen(3000, () => mongoose.connect('mongodb://localhost/klack'))