const express = require('express');
const fs = require('fs');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

const usersFile = './users.json';
let players = {};

app.use(express.static('public'));
app.use(express.json());

app.post('/register', (req, res) => {
    const { username, password, classe } = req.body;
    const users = readUsers();
    if (users[username]) {
        return res.status(400).json({ message: 'Usuário já existe' });
    }
    users[username] = { password, classe };
    saveUsers(users);
    res.json({ message: 'Registrado com sucesso' });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const users = readUsers();
    if (!users[username] || users[username].password !== password) {
        return res.status(400).json({ message: 'Credenciais inválidas' });
    }
    res.json({ message: 'Login bem-sucedido', classe: users[username].classe });
});

app.post('/delete', (req, res) => {
    const { username, password, socketId } = req.body;
    const users = readUsers();

    if (!users[username] || users[username].password !== password) {
        return res.status(400).json({ message: 'Credenciais inválidas' });
    }

    delete users[username];
    saveUsers(users);

    if (players[socketId] && players[socketId].nome === username) {
        delete players[socketId];
    }

    res.json({ message: 'Conta deletada com sucesso' });
    io.emit('updatePlayers', players);
});

app.post('/rename', (req, res) => {
    const { oldName, newName, password } = req.body;
    const users = readUsers();

    if (!users[oldName] || users[oldName].password !== password) {
        return res.status(400).json({ message: 'Credenciais inválidas' });
    }
    if (users[newName]) {
        return res.status(400).json({ message: 'Novo nome já em uso' });
    }

    users[newName] = { ...users[oldName] };
    delete users[oldName];
    saveUsers(users);

    for (const id in players) {
        if (players[id].nome === oldName) {
            players[id].nome = newName;
            break;
        }
    }

    res.json({ message: 'Nome alterado com sucesso' });
    io.emit('updatePlayers', players); 
});

io.on('connection', (socket) => {
    socket.on('newPlayer', ({ nome, classe }) => {
        players[socket.id] = {
            nome,
            classe,
            x: 100,
            y: 100
        };
        io.emit('updatePlayers', players); 
    });

    socket.on('move', ({ x, y }) => {
        if (players[socket.id]) {
            players[socket.id].x = x;
            players[socket.id].y = y;
            io.emit('updatePlayers', players); 
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id]; 
        io.emit('updatePlayers', players); 
    });
});

function readUsers() {
    if (!fs.existsSync(usersFile)) return {};
    try {
        const data = fs.readFileSync(usersFile);
        return JSON.parse(data);
    } catch (err) {
        console.error('Erro ao ler users.json:', err);
        return {};
    }
}

function saveUsers(users) {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

http.listen(8080, () => {
    console.log('Servidor rodando em http://localhost:8080');
});
