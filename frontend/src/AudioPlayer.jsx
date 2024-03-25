import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const AudioPlayer = () => {
  const audioRef = useRef(null);
  const [musicList, setMusicList] = useState([]);
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioChunks, setAudioChunks] = useState([]);

  useEffect(() => {
    const fetchMusicList = async () => {
      try {
        const response = await fetch("https://lexy-music.onrender.com/music-list"); // Replace with your server URL
        if (!response.ok) {
          throw new Error("Failed to fetch music list");
        }
        const musicList = await response.json();
        setMusicList(musicList);
      } catch (error) {
        console.error("Error fetching music list", error);
      }
    };

    fetchMusicList();
  }, []);

  const socket = io("https://lexy-music.onrender.com"); // Replace with your server URL

  socket.on("audioChunk", (chunk) => {
    setAudioChunks((prevChunks) => [...prevChunks, chunk]);
  });

  socket.on("audioEnd", () => {
    setIsPlaying(false);
  });

  const handlePlay = (filename) => {
    setSelectedMusic(filename);
    setAudioChunks([]);
    socket.emit("stream-music", filename);
    setIsPlaying(true);
  };

  useEffect(() => {
    const audioElement = audioRef.current;

    if (isPlaying && audioChunks.length > 0) {
      const mergedChunks = new Uint8Array(
        audioChunks.reduce((acc, chunk) => acc + chunk.byteLength, 0)
      );

      let offset = 0;
      audioChunks.forEach((chunk) => {
        mergedChunks.set(new Uint8Array(chunk), offset);
        offset += chunk.byteLength;
      });

      const blob = new Blob([mergedChunks], { type: "audio/mpeg" });
      const objectURL = URL.createObjectURL(blob);
      audioElement.src = objectURL;
      audioElement.play();
    }
  }, [isPlaying, audioChunks]);

  return (
    <div>
      <h2>Music List</h2>
      <ul>
        {musicList.map((music) => (
          <li key={music} onClick={() => handlePlay(music)}>
            {music}
          </li>
        ))}
      </ul>
      {selectedMusic && (
        <div>
          <h3>Now Playing: {selectedMusic}</h3>
          <audio ref={audioRef} controls />
        </div>
      )}
      {isPlaying && <p>Playing...</p>}
    </div>
  );
};

export default AudioPlayer;