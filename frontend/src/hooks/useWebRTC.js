import { useState, useRef, useCallback, useEffect } from 'react';
import Peer from 'simple-peer';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' }
];

/**
 * Custom hook for WebRTC video/voice calls
 * @param {Object} socket - Socket.io instance
 * @returns {Object} WebRTC state and controls
 */
export const useWebRTC = (socket) => {
  const [stream, setStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callStatus, setCallStatus] = useState('idle'); // idle, calling, ringing, connected, ended
  const [callType, setCallType] = useState('video'); // video or voice
  const [caller, setCaller] = useState(null);
  const [callerSignal, setCallerSignal] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [error, setError] = useState(null);

  const myVideoRef = useRef(null);
  const userVideoRef = useRef(null);
  const connectionRef = useRef(null);
  const streamRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, []);

  // Initialize media stream
  const initStream = useCallback(async (type = 'video') => {
    try {
      const constraints = {
        audio: true,
        video: type === 'video'
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setCallType(type);
      
      if (myVideoRef.current) {
        myVideoRef.current.srcObject = mediaStream;
      }
      
      return mediaStream;
    } catch (err) {
      console.error('Error accessing media devices:', err);
      setError('Could not access camera/microphone. Please check permissions.');
      return null;
    }
  }, []);

  // Start a call
  const startCall = useCallback(async (toUsername, type = 'video') => {
    try {
      const mediaStream = await initStream(type);
      if (!mediaStream) return;

      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream: mediaStream,
        config: { iceServers: ICE_SERVERS }
      });

      peer.on('signal', (data) => {
        if (socket) {
          socket.emit('call-user', {
            userToCall: toUsername,
            signalData: data,
            from: localStorage.getItem('username'),
            type: type
          });
        }
      });

      peer.on('stream', (remoteStream) => {
        setRemoteStream(remoteStream);
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = remoteStream;
        }
      });

      peer.on('error', (err) => {
        console.error('Peer error:', err);
        setError('Call connection error');
        endCall();
      });

      peer.on('close', () => {
        endCall();
      });

      connectionRef.current = peer;
      setCallStatus('calling');
      setCaller(toUsername);
      
    } catch (err) {
      console.error('Error starting call:', err);
      setError('Could not start call');
    }
  }, [socket, initStream]);

  // Answer incoming call
  const answerCall = useCallback(async () => {
    try {
      const mediaStream = await initStream(callType);
      if (!mediaStream) return;

      const peer = new Peer({
        initiator: false,
        trickle: false,
        stream: mediaStream,
        config: { iceServers: ICE_SERVERS }
      });

      peer.on('signal', (data) => {
        if (socket) {
          socket.emit('answer-call', { signal: data, to: caller });
        }
      });

      peer.on('stream', (remoteStream) => {
        setRemoteStream(remoteStream);
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = remoteStream;
        }
      });

      peer.on('error', (err) => {
        console.error('Peer error:', err);
        setError('Call connection error');
        endCall();
      });

      peer.on('close', () => {
        endCall();
      });

      peer.signal(callerSignal);
      connectionRef.current = peer;
      setCallStatus('connected');
      
    } catch (err) {
      console.error('Error answering call:', err);
      setError('Could not answer call');
    }
  }, [socket, caller, callerSignal, callType, initStream]);

  // Reject incoming call
  const rejectCall = useCallback(() => {
    if (socket && caller) {
      socket.emit('reject-call', { to: caller });
    }
    setCallStatus('idle');
    setCaller(null);
    setCallerSignal(null);
  }, [socket, caller]);

  // End call
  const endCall = useCallback(() => {
    if (connectionRef.current) {
      connectionRef.current.destroy();
      connectionRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setStream(null);
    setRemoteStream(null);
    setCallStatus('idle');
    setCaller(null);
    setCallerSignal(null);
    setIsMuted(false);
    setIsVideoEnabled(true);
    
    if (myVideoRef.current) {
      myVideoRef.current.srcObject = null;
    }
    if (userVideoRef.current) {
      userVideoRef.current.srcObject = null;
    }
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        setIsMuted(!isMuted);
      }
    }
  }, [isMuted]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
        setIsVideoEnabled(!isVideoEnabled);
      }
    }
  }, [isVideoEnabled]);

  // Handle incoming call signal
  const handleIncomingSignal = useCallback((signal) => {
    if (connectionRef.current && callStatus === 'connected') {
      connectionRef.current.signal(signal);
    }
  }, [callStatus]);

  // Set up socket listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('call-received', ({ from, signal, type }) => {
      setCaller(from);
      setCallerSignal(signal);
      setCallType(type || 'video');
      setCallStatus('ringing');
    });

    socket.on('call-accepted', (signal) => {
      setCallStatus('connected');
      handleIncomingSignal(signal);
    });

    socket.on('call-ended', () => {
      endCall();
    });

    socket.on('call-rejected', () => {
      endCall();
    });

    return () => {
      socket.off('call-received');
      socket.off('call-accepted');
      socket.off('call-ended');
      socket.off('call-rejected');
    };
  }, [socket, endCall, handleIncomingSignal]);

  return {
    stream,
    remoteStream,
    callStatus,
    callType,
    caller,
    isMuted,
    isVideoEnabled,
    error,
    myVideoRef,
    userVideoRef,
    startCall,
    answerCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo
  };
};

export default useWebRTC;