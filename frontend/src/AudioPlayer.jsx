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
        // const response = await fetch("http://localhost:3000/music-list"); // Replace with your server URL
        const response = await fetch(
          "https://lexy-music.onrender.com/music-list"
        ); // Replace with your server URL
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

  // const socket = io("http://localhost:3000"); // Replace with your server URL
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
      <div className="flex items-center mx-[2vw] my-2 gap-2 bg-gray-100 w-[96vw] p-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>

        <input
          type="text"
          placeholder="Search music"
          className="flex-1 focus:outline-none bg-transparent text-md"
        />
      </div>
      <ul className="mx-[2vw]">
        {musicList.map((music) => (
          <li
            key={music}
            onClick={() => handlePlay(music)}
            className="cursor-pointer hover:bg-gray-200 p-2 rounded-md"
          >
            {music.split(".mp3")[0]}
          </li>
        ))}
      </ul>
      {selectedMusic && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-100 p-4 flex">
          <div className="flex items-center gap-2">
            <img
              src="https://avatars.githubusercontent.com/u/135448616?v=4"
              alt=""
              className="h-9 w-9 rounded"
            />
            <div>
              <h3>{selectedMusic.split("-")[0]}</h3>
              <p className="text-sm font-medium text-gray-500">
                {selectedMusic.split("-")[1].split(".")[0]}
              </p>
            </div>
          </div>
          <audio ref={audioRef} controls />
        </div>
      )}
    </div>
  );
};

export default AudioPlayer;
