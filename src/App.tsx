import React from 'react';

export default function App() {
  return (
    <div className="w-screen h-screen m-0 p-0 overflow-hidden bg-slate-950">
      <iframe
        id="runner-game-frame"
        src="/game.html"
        className="w-full h-full border-0 outline-none block"
        title="WASM Endless Runner play frame"
        allow="autoplay"
      />
    </div>
  );
}
