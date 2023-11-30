import { useState } from "react";
import ReactPlayer from "react-player/lazy";

import { hasProperty } from "src/lib/utils";

interface VideoPlayerProps {
  src: string;
  className?: string;
}

enum PlayerError {
  UNKNOWN = "UNKNOWN",
  ACCESS_DENIED = "ACCESS_DENIED",
}

export const VideoPlayer = ({ src, className }: VideoPlayerProps) => {
  const [playerError, setPlayerError] = useState<PlayerError | null>(null);

  const handleError = (error: string, data: object) => {
    if (
      data &&
      hasProperty(data, "response") &&
      hasProperty(data.response, "code") &&
      `${data.response.code}` === "403"
    ) {
      setPlayerError(PlayerError.ACCESS_DENIED);
    }
  };

  return (
    <div className={className} data-testid={`video-player-for-${src}`}>
      {playerError ? (
        <div className="aspect-video h-full w-full text-white">
          {playerError === PlayerError.UNKNOWN && (
            <p>Unknown Error playing Video</p>
          )}
          {playerError === PlayerError.ACCESS_DENIED && <p>Access denied</p>}
        </div>
      ) : (
        <ReactPlayer
          url={src}
          height="100%"
          width="100%"
          controls
          onError={handleError}
        />
      )}
    </div>
  );
};
