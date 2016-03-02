var colors = require('colors') // Módulo só pra aviadar meu "terminal" :P
,   express  = require('express') // Importando o framework ExpressJS
,   sio = require('socket.io') // Importando o módulo socket.tio
,   http = require('http') // Importando o módulo nativo HTTP

,   app = express() // Inicializando o framework ExpressJS
,   server = http.createServer(app) // Criando um servidor HTTP
,   io = sio(server) // Inicializando o meu módulo socket.io passando o meu servidor como parâmetro
,   online = []
;

app.get('/', function(req, res, next){
    // Servindo o meu .html na rota pricipal
    res.sendFile(__dirname + '/index.html')
});

io.on('connection', function(socket){

    var client = { id: socket.client.id, room: undefined };

    // Consolezinho para avisar que alguém se conectou
    console.log('\nUsuário conectado:'.green, socket.client.id);

    // Listener para o evento quando o usuário disconectado
    socket.on('disconnect', function(){
        console.log('\nUsuário desconectado:'.red, socket.client.id);
        online.forEach(function(el, idx){
            if(el.client == socket.client.id){ online.splice(idx, 1); }
        });
    });

    // Listener para o evento que cria uma sala assim que o usuário se conecta
    socket.on('create-room', function(room){
        client.room = room;
        socket.join(client.room);
        online.push(client);
        console.log('\nSala criada'.cyan, client.room, 'para'.cyan, client.id);
        socket.broadcast.emit('user-connected', 'Usuário <b>'+ client.id + '</b> acabou de se conectar.');
    });

    // Listener no caso do envio de mensagem pública
    socket.on('send-msg-public', function(msg){
        var msg = '<b>' + client.id + '</b>: ' + msg;
        socket.emit('send-msg-public', msg);
        socket.broadcast.emit('send-msg-public', msg);
    });

    // Listener no caso do envio de mensagem privada
    socket.on('send-msg-private', function(data){
        var msg = '<b>' + client.id + '</b>: ' + data.msg;
        socket.emit('send-msg-private', msg);
        online.forEach(function(el){
            if(el.id == data.target){ socket.to(el.room).emit('send-msg-private', msg); }
        });
    });

    // Test
    socket.on('is-typing', function(data){
        socket.broadcast.emit('is-typing', {client: client.id, isTyping: data});
    });

});

server.listen(4450, function(){
    var address = this.address();
    console.log('Server is running on port', address.port);
});