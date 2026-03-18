import React, { useEffect, useRef, useState } from "react";
import { PhoneOff, Video as VideoIcon, Mic, MicOff, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoCallRoomProps {
  bookingId: string;
  onClose: () => void;
}

// We use Google's free public STUN servers for the MVP to find public IP addresses
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

const VideoCallRoom = ({ bookingId, onClose }: VideoCallRoomProps) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [status, setStatus] = useState("Initializing camera...");

  useEffect(() => {
    let localStream: MediaStream | null = null;

    const startCall = async () => {
      try {
        // 1. Get Local Camera & Mic
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }

        // 2. Setup WebRTC Peer Connection
        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnectionRef.current = pc;

        // Push our local camera tracks into the WebRTC connection
        localStream.getTracks().forEach((track) => pc.addTrack(track, localStream!));

        // Listen for the OTHER person's video track arriving
        pc.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
            setStatus("Connected!");
          }
        };

        // 3. Connect to Go WebSocket Signaling Server
        const wsUrl = `ws://localhost:8080/ws/video?booking_id=${bookingId}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        // --- THE WEBRTC DANCE (SIGNALING) ---

        // A. Send ICE Candidates to the other peer via Go
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            ws.send(JSON.stringify({ type: "ice-candidate", candidate: event.candidate }));
          }
        };

        ws.onopen = () => {
          setStatus("Waiting for the other person to join...");
          // Tell the room we are here. If the other person is already here, 
          // this will trigger them to send us an Offer.
          ws.send(JSON.stringify({ type: "user-joined" }));
        };

        ws.onmessage = async (event) => {
          const message = JSON.parse(event.data);

          if (message.type === "user-joined") {
            // The other person just joined! We are the caller. Create an Offer.
            setStatus("Connecting peers...");
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            ws.send(JSON.stringify({ type: "offer", offer }));
          } 
          
          else if (message.type === "offer") {
            // We received an Offer. We are the receiver. Create an Answer.
            setStatus("Incoming video stream...");
            await pc.setRemoteDescription(new RTCSessionDescription(message.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            ws.send(JSON.stringify({ type: "answer", answer }));
          } 
          
          else if (message.type === "answer") {
            // We received the Answer. The connection is sealed!
            await pc.setRemoteDescription(new RTCSessionDescription(message.answer));
          } 
          
          else if (message.type === "ice-candidate") {
            // We received a network coordinate. Add it to WebRTC.
            await pc.addIceCandidate(new RTCIceCandidate(message.candidate));
          }
        };

      } catch (error) {
        console.error("Error accessing media devices or WebRTC:", error);
        setStatus("Failed to access camera/mic.");
      }
    };

    startCall();

    // 4. Cleanup when hanging up
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [bookingId]);

  // Media Toggles (Unchanged)
  const toggleVideo = () => {
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getVideoTracks().forEach(track => track.enabled = !isCameraOn);
      setIsCameraOn(!isCameraOn);
    }
  };

  const toggleMic = () => {
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getAudioTracks().forEach(track => track.enabled = !isMicOn);
      setIsMicOn(!isMicOn);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
      {/* Top Status Bar */}
      <div className="absolute top-4 left-4 right-4 flex justify-between text-white z-10">
        <div className="bg-black/50 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
          {status}
        </div>
      </div>

      {/* Video Grid */}
      <div className="w-full max-w-5xl aspect-video relative bg-slate-900 rounded-2xl overflow-hidden shadow-2xl">
        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />

        {/* Local Video (Muted to prevent echo!) */}
        <div className="absolute bottom-6 right-6 w-48 aspect-video bg-black rounded-xl overflow-hidden border-2 border-white/20 shadow-lg">
          <video ref={localVideoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${!isCameraOn ? 'opacity-0' : ''}`} />
          {!isCameraOn && (
            <div className="absolute inset-0 flex items-center justify-center text-white bg-slate-800">
              <VideoOff className="w-8 h-8" />
            </div>
          )}
        </div>
      </div>

      {/* Control Bar */}
      <div className="absolute bottom-8 flex items-center gap-4 bg-black/60 p-4 rounded-full backdrop-blur-md">
        <Button variant="outline" size="icon" className={`rounded-full w-12 h-12 border-none ${isMicOn ? 'bg-white/20 text-white' : 'bg-red-500 text-white'}`} onClick={toggleMic}>
          {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </Button>
        <Button variant="destructive" size="icon" className="rounded-full w-14 h-14 bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20" onClick={onClose}>
          <PhoneOff className="w-6 h-6" />
        </Button>
        <Button variant="outline" size="icon" className={`rounded-full w-12 h-12 border-none ${isCameraOn ? 'bg-white/20 text-white' : 'bg-red-500 text-white'}`} onClick={toggleVideo}>
          {isCameraOn ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </Button>
      </div>
    </div>
  );
};

export default VideoCallRoom;