import React from "react";
import { AlertTriangle } from "lucide-react";

export default function ErrorModal({ onClose, title, message }) {
  if (!message) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      ></div>

      {/* Modal Card - GitHub Style Dark Theme */}
      <div className="relative w-full max-w-md bg-[#0d1117] border border-red-500/20 rounded-2xl shadow-2xl overflow-hidden animate-[contentSlide_0.3s_ease-out_forwards]">
        {/* Top Danger Line (Blinks/Pulses) */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 animate-pulse"></div>

        <div className="p-8 text-center">
          {/* Warning Icon with Glow */}
          <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-5 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.15)]">
            <AlertTriangle className="text-red-500 w-8 h-8 animate-[pulse_2s_infinite]" />
          </div>

          <h3 className="text-xl font-bold text-white mb-3 tracking-tight">
            {title}
          </h3>

          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 mb-6 text-left">
            <p className="text-gray-300 text-sm font-mono leading-relaxed break-words">
              <span className="text-red-400 font-bold mr-2">&gt;</span>
              {message}
              <span className="inline-block w-2 h-4 ml-1 bg-red-500/50 animate-pulse align-middle"></span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-[#238636] hover:bg-[#2ea043] text-white rounded-lg font-semibold text-sm transition-all duration-200 shadow-lg shadow-green-900/20 border border-[rgba(240,246,252,0.1)]"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
}
