const app = require("express")();    //Express Js is a framework used to create a server side application.
const server = require("http").createServer(app);    //We are creating a server that can run application built using express js framework.
const cors = require("cors");

const io = require("socket.io")(server, {
	cors: {
		origin: "*",
		methods: [ "GET", "POST" ]
	}
});

app.use(cors());

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
	res.send('Running');
});


//io refers to a particular socket-server instance. it listens to all the server side events of the socket connection instance. 
//socket refers to individual client socket that has connected to the server. It listens to all the events specific to that socket. It listens to all the client specific events.
io.on("connection", (socket) => {
	socket.emit("me", socket.id);

	socket.on("disconnect", () => {
		socket.broadcast.emit("callEnded")
	});

	socket.on("callUser", ({ userToCall, signalData, from, name }) => {
		io.to(userToCall).emit("callUser", { signal: signalData, from, name });
	});

	socket.on("answerCall", (data) => {
		io.to(data.to).emit("callAccepted", data.signal)
	});
});

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
