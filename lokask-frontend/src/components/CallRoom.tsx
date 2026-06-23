import React, { useEffect, useRef, useState } from "react";
import {
  PhoneOff,
  Video as VideoIcon,
  Mic,
  MicOff,
  VideoOff,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Booking } from "@/types/booking";

interface CallRoomProps {
  bookingId: string;
  serviceType: Booking["service_type"];
  onClose: () => void;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

const CallRoom = ({ bookingId, serviceType, onClose }: CallRoomProps) => {
  const localMediaRef = useRef<HTMLVideoElement>(null);
  const remoteMediaRef = useRef<HTMLVideoElement>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  
  const iceQueueRef = useRef<RTCIceCandidateInit[]>([]);

  const isVideoCall = serviceType === "video_call";

  const [isCameraOn, setIsCameraOn] = useState(isVideoCall);
  const [isMicOn, setIsMicOn] = useState(true);
  const [status, setStatus] = useState("Initializing media...");

  useEffect(() => {
    let isMounted = true;
    let localStream: MediaStream | null = null;

    const startCall = async () => {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: isVideoCall,
          audio: true,
        });

        if (!isMounted) return;

        if (localMediaRef.current) {
          localMediaRef.current.srcObject = localStream;
        }

        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnectionRef.current = pc;

        localStream
          .getTracks()
          .forEach((track) => pc.addTrack(track, localStream!));

        pc.ontrack = (event) => {
          if (remoteMediaRef.current && event.streams[0]) {
            remoteMediaRef.current.srcObject = event.streams[0];
            setStatus("Connected!");
          }
        };

        const token = sessionStorage.getItem("token") || "";
        const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsHost = window.location.host;
        const wsUrl = `${wsProtocol}//${wsHost}/ws/video?booking_id=${bookingId}&token=${token}`;
        
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        pc.onicecandidate = (event) => {
          if (event.candidate && ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: "ice-candidate",
                candidate: event.candidate,
              }),
            );
          }
        };

        ws.onopen = () => {
          if (!isMounted) return;
          setStatus("Waiting for the other person to join...");
          ws.send(JSON.stringify({ type: "user-joined" }));
        };

        ws.onmessage = async (event) => {
          if (!isMounted) return;
          try {
            const message = JSON.parse(event.data);

            if (message.type === "user-joined") {
              setStatus("Connecting peers...");
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              ws.send(JSON.stringify({ type: "offer", offer }));
              
            } else if (message.type === "offer") {
              setStatus("Incoming stream...");
              await pc.setRemoteDescription(new RTCSessionDescription(message.offer));
              
              for (const cand of iceQueueRef.current) {
                await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(console.error);
              }
              iceQueueRef.current = [];

              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              ws.send(JSON.stringify({ type: "answer", answer }));
              
            } else if (message.type === "answer") {
              await pc.setRemoteDescription(new RTCSessionDescription(message.answer));
              
              for (const cand of iceQueueRef.current) {
                await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(console.error);
              }
              iceQueueRef.current = [];
              setStatus("Connected!");

            } else if (message.type === "ice-candidate") {
              if (pc.remoteDescription && pc.remoteDescription.type) {
                await pc.addIceCandidate(new RTCIceCandidate(message.candidate)).catch(console.error);
              } else {
                iceQueueRef.current.push(message.candidate);
              }
            }
          } catch (err) {
            console.error("Signaling processing error:", err);
          }
        };
      } catch (error) {
        console.error("Media/WebRTC Error:", error);
        if (isMounted) setStatus("Failed to access camera/mic.");
      }
    };

    startCall();

    return () => {
      isMounted = false;
      if (localStream) localStream.getTracks().forEach((track) => track.stop());
      if (peerConnectionRef.current) peerConnectionRef.current.close();
      if (wsRef.current) wsRef.current.close();
    };
  }, [bookingId, isVideoCall]);

  const toggleVideo = () => {
    if (!isVideoCall) return; 
    if (localMediaRef.current?.srcObject) {
      const stream = localMediaRef.current.srcObject as MediaStream;
      stream.getVideoTracks().forEach((track) => (track.enabled = !isCameraOn));
      setIsCameraOn(!isCameraOn);
    }
  };

  const toggleMic = () => {
    if (localMediaRef.current?.srcObject) {
      const stream = localMediaRef.current.srcObject as MediaStream;
      stream.getAudioTracks().forEach((track) => (track.enabled = !isMicOn));
      setIsMicOn(!isMicOn);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-4">
      {/* Top Status */}
      <div className="absolute top-4 left-4 right-4 flex justify-between text-white z-10">
        <div className="bg-white/10 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-md border border-white/10">
          {status}
        </div>
      </div>

      {/* Main Media Container */}
      <div className="w-full max-w-5xl aspect-video relative bg-slate-900 rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center border border-white/10">
        {/* Remote Feed */}
        <video
          ref={remoteMediaRef}
          autoPlay
          playsInline
          className={`w-full h-full object-cover ${!isVideoCall ? "hidden" : ""}`}
        />

        {/* Audio-Only Fallback Avatar */}
        {!isVideoCall && (
          <div className="flex flex-col items-center justify-center text-slate-400">
            <div className="w-32 h-32 rounded-full bg-slate-800 flex items-center justify-center mb-6 shadow-inner">
              <User className="w-16 h-16 text-slate-500" />
            </div>
            <p className="text-xl font-medium text-white">Voice Call</p>
          </div>
        )}

        {/* Local Picture-in-Picture */}
        {isVideoCall && (
          <div className="absolute bottom-6 right-6 w-48 aspect-video bg-black rounded-xl overflow-hidden border-2 border-white/20 shadow-xl">
            <video
              ref={localMediaRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${!isCameraOn ? "opacity-0" : ""}`}
            />
            {!isCameraOn && (
              <div className="absolute inset-0 flex items-center justify-center text-white bg-slate-800">
                <VideoOff className="w-8 h-8" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-10 flex items-center gap-6 bg-white/10 p-4 rounded-full backdrop-blur-xl border border-white/10">
        <Button
          variant="outline"
          size="icon"
          className={`rounded-full w-14 h-14 border-none ${isMicOn ? "bg-white/20 hover:bg-white/30 text-white" : "bg-red-500 hover:bg-red-600 text-white"}`}
          onClick={toggleMic}
        >
          {isMicOn ? (
            <Mic className="w-6 h-6" />
          ) : (
            <MicOff className="w-6 h-6" />
          )}
        </Button>

        <Button
          variant="destructive"
          size="icon"
          className="rounded-full w-16 h-16 bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20"
          onClick={onClose}
        >
          <PhoneOff className="w-7 h-7" />
        </Button>

        {isVideoCall && (
          <Button
            variant="outline"
            size="icon"
            className={`rounded-full w-14 h-14 border-none ${isCameraOn ? "bg-white/20 hover:bg-white/30 text-white" : "bg-red-500 hover:bg-red-600 text-white"}`}
            onClick={toggleVideo}
          >
            {isCameraOn ? (
              <VideoIcon className="w-6 h-6" />
            ) : (
              <VideoOff className="w-6 h-6" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default CallRoom;