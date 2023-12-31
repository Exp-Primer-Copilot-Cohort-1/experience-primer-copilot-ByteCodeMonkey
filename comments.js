// Create web server
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const { randomBytes } = require('crypto');
const app = express();

// Middlewares
app.use(bodyParser.json());
app.use(cors());

// Variables
const commentsByPostId = {};

// Routes
app.get('/posts/:id/comments', (req, res) => {
    res.status(200).send(commentsByPostId[req.params.id] || []);
});

app.post('/posts/:id/comments', async (req, res) => {
    const commentId = randomBytes(4).toString('hex');
    const { content } = req.body;
    const comments = commentsByPostId[req.params.id] || [];

    comments.push({
        id: commentId,
        content,
        status: 'pending'
    });

    commentsByPostId[req.params.id] = comments;

    await axios.post('http://localhost:4005/events', {
        type: 'CommentCreated',
        data: {
            id: commentId,
            content,
            postId: req.params.id,
            status: 'pending'
        }
    });

    res.status(201).send(comments);
});

app.post('/events', async (req, res) => {
    console.log('Event Received:', req.body.type);
    const { type, data } = req.body;
    const { id, postId, status } = data;
    const comments = commentsByPostId[postId];

    if (type === 'CommentModerated') {
        const comment = comments.find(comment => comment.id === id);
        comment.status = status;

        await axios.post('http://localhost:4005/events', {
            type: 'CommentUpdated',
            data: {
                id,
                postId,
                status,
                content: comment.content
            }
        });
    }

    res.send({});
});

// Listen for requests
app.listen(4001, () => {
    console.log('Listening on port 4001...');
});
