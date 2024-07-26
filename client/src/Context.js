import React, { createContext, useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';

const SocketContext = createContext();

// const socket = io('http://localhost:5000');
const socket = io('http://localhost:3000', { transports: ['websocket'] });// we are initializing socket on the backend server (currently localhost 3000).

const ContextProvider = ({ children }) => {
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [stream, setStream] = useState();
  const [name, setName] = useState('');
  const [call, setCall] = useState({});
  const [me, setMe] = useState('');

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })// First we get the permission to access the audio and video(of device) using in built navigator,if access is provided we set the stream.
      .then((currentStream) => {
        setStream(currentStream);

        myVideo.current.srcObject = currentStream;// Setting video for both sender and reciever(1st sender then as the reciever accepts the call than sets for reciever).
      });

    socket.on('me', (id) => setMe(id));

    socket.on('callUser', ({ from, name: callerName, signal }) => { // This will work for the reciever's side.
      setCall({ isReceivingCall: true, from, name: callerName, signal });
    });
  }, []);

  const answerCall = () => {
    setCallAccepted(true);

    const peer = new Peer({ initiator: false, trickle: false, stream });// Initializing the reciever peer(2nd person) with the stored 'stream' from 'setStream'.

    peer.signal(call.signal);// Connecting the reciever peer with the signal used by caller to call i.e setting the reciever's signal to the sender's signal.

    peer.on('signal', (data) => {
      socket.emit('answerCall', { signal: data, to: call.from });
    });

    peer.on('stream', (currentStream) => {
      userVideo.current.srcObject = currentStream;
    });

    connectionRef.current = peer;
  };

  const callUser = (id) => { // This id refers to the id on which we make a call (receiver's id).
    const peer = new Peer({ initiator: true, trickle: false, stream });

    // As soon as we create a peer instance,it generates an event called 'signal' which is used to handle the signal of the peer instance.It generates a signaling data that is sent to the remote peer for establishing a connection.
    peer.on('signal', (data) => {
      socket.emit('callUser', { userToCall: id, signalData: data, from: me, name });
    });

    peer.on('stream', (currentStream) => {
      userVideo.current.srcObject = currentStream;
    });

    socket.on('callAccepted', (signal) => {
      setCallAccepted(true);

      peer.signal(signal);
    });

    connectionRef.current = peer;
  };

  const leaveCall = () => {
    setCallEnded(true);

    connectionRef.current.destroy();

    window.location.reload();
  };

  return (
    <SocketContext.Provider value={{
      call,
      callAccepted,
      myVideo,
      userVideo,
      stream,
      name,
      setName,
      callEnded,
      me,
      callUser,
      leaveCall,
      answerCall,
    }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export { ContextProvider, SocketContext };
