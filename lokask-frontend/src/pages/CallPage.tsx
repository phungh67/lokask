import { useParams, useSearchParams } from "react-router-dom";
import CallRoom from "@/components/CallRoom";

const CallPage = () => {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const serviceType = searchParams.get("type") as "video_call" | "voice_call";

  if (!roomId || !serviceType) {
    return (
      <div className="p-8 text-white bg-slate-950 h-screen">
        Invalid Call Link
      </div>
    );
  }

  return (
    <CallRoom
      bookingId={roomId}
      serviceType={serviceType}
      onClose={() => window.close()}
    />
  );
};

export default CallPage;