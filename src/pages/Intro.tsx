import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import introVideo from '../Assets/loader.mp4';

const Intro: React.FC = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    video?.play().catch(() => {
      navigate('/login', { replace: true });
    });
  }, [navigate]);

  const handleEnd = () => {
    navigate('/login', { replace: true });
  };

  const handleError = () => {
    navigate('/login', { replace: true });
  };

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        src={introVideo}
        className="w-full h-full object-cover"
        autoPlay
        playsInline
        onEnded={handleEnd}
        onError={handleError}
      />
    </div>
  );
};

export default Intro;
