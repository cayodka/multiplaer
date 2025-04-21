const socket = io();
const game = document.getElementById('game');
const nome = localStorage.getItem('username');
const senha = localStorage.getItem('password');
const classe = localStorage.getItem('classe');

socket.emit('newPlayer', { nome, classe });

let x = 100, y = 100;
const velocidade = 25;

document.addEventListener('keydown', (e) => {
    if (e.key === 'w') y -= velocidade;
    if (e.key === 's') y += velocidade;
    if (e.key === 'a') x -= velocidade;
    if (e.key === 'd') x += velocidade;
    socket.emit('move', { x, y });
});

socket.on('updatePlayers', (players) => {
    for (let id in players) {
        const p = players[id];
        let playerDiv = document.getElementById(id);
        
        if (!playerDiv) {
            playerDiv = document.createElement('div');
            playerDiv.id = id; 
            playerDiv.className = 'player';
            game.appendChild(playerDiv);
        }

        playerDiv.style.left = p.x + 'px';
        playerDiv.style.top = p.y + 'px';
        playerDiv.style.backgroundColor = p.nome === nome ? 'red' : 'blue';
        playerDiv.innerText = `${p.nome}\n${p.classe}`;
    }

    const lista = document.getElementById('online-list');
    const nomes = Object.values(players).map(p => `${p.nome}/${p.classe}`).sort();
    lista.innerHTML = nomes.map(n => `<div>${n}</div>`).join('');
});

function alterarNome() {
    const novoNome = document.getElementById('novoNome').value.trim();
    if (!novoNome) {
        alert("Digite um novo nome válido");
        return;
    }

    fetch('/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            oldName: nome,
            newName: novoNome,
            password: senha
        })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
        if (data.message === 'sucesso') {
            localStorage.setItem('username', novoNome);
            location.reload();
        }
    })
    .catch(err => console.error("Erro ao renomear:", err));
}

function excluirConta() {
    if (!confirm("Tem certeza que deseja excluir sua conta? Essa ação é irreversível.")) return;

    fetch('/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: nome,
            password: senha
        })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
        if (data.message === 'Conta deletada com sucesso') {
            localStorage.clear();
            window.location.href = '/';
        }
    })
    .catch(err => console.error("Erro ao excluir conta:", err));
}
