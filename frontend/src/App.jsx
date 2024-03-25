import React from "react";
import AudioPlayer from "./AudioPlayer";

const App = () => {
  return (
    <div>
      <div className="flex items-center gap-2 p-2 border-b-2 border-b-gray-300">
        <img
          src="https://avatars.githubusercontent.com/u/135448616?v=4"
          alt=""
          className="h-10 w-10 rounded-full"
        />
        <h1 className="jost text-xl">Lexy Music</h1>
      </div>
      <AudioPlayer />
    </div>
  );
};

export default App;
