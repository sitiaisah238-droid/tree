
import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { PHOTOS } from '../constants';
import { InteractionState } from '../types';

interface UIOverlayProps {
  activePhotoIndex?: number;
  interactionState?: InteractionState;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ activePhotoIndex = 0, interactionState = InteractionState.IDLE }) => {
  const [greeting, setGreeting] = useState<string>("Merry Christmas!");
  const [isGenerating, setIsGenerating] = useState(false);

  const generateAIWhisper = async () => {
    setIsGenerating(true);
    try {
      // Followed guidelines: Use process.env.API_KEY directly in the initialization object
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: 'Write a short, poetic, one-sentence Christmas wish inspired by stars and magic.',
      });
      setGreeting(response.text || "May your holidays sparkle with magic!");
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-10 flex flex-col justify-between p-8 md:p-12">
      <div className="flex justify-between items-start">
        <div className="animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-pink-500 to-purple-400">
            Merry Christmas
          </h1>
          <p className="text-pink-200/60 mt-2 tracking-widest text-sm uppercase italic">Cinematic Memory Tree</p>
        </div>
        
        <button 
          onClick={generateAIWhisper}
          disabled={isGenerating}
          className="pointer-events-auto bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 px-4 py-2 rounded-full flex items-center gap-2 backdrop-blur-md transition-all text-pink-200 text-sm group shadow-lg shadow-pink-500/10"
        >
          <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : 'group-hover:scale-125 transition-transform'}`} />
          {isGenerating ? "Whispering..." : "AI Blessing"}
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
         <div className="max-w-xl text-center mb-8">
            <p className="text-xl md:text-2xl font-display italic text-pink-100/90 drop-shadow-[0_0_15px_rgba(255,105,180,0.4)] transition-all duration-700">
              "{interactionState === InteractionState.APPROACHING ? "Viewing details..." : greeting}"
            </p>
         </div>
         <div className="flex gap-2">
            {PHOTOS.map((_, i) => (
              <div 
                key={i} 
                className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${i === activePhotoIndex ? 'bg-pink-400 w-5 shadow-[0_0_12px_#F472B6]' : 'bg-pink-400/20'}`} 
              />
            ))}
         </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-3 bg-black/40 p-5 rounded-3xl backdrop-blur-xl border border-white/10 shadow-2xl">
          <div className="flex items-center gap-3 text-pink-300/80">
            <div className="w-8 h-8 border-2 border-pink-400/50 rounded-lg flex items-center justify-center text-[16px] font-bold bg-pink-500/20">✊</div>
            <div className="text-xs">
              <span className="font-bold text-pink-200 block uppercase tracking-wider">握拳:</span> 汇聚粒子生成圣诞树
            </div>
          </div>
          <div className="flex items-center gap-3 text-pink-300/80">
            <div className="w-8 h-8 border-2 border-pink-400/50 rounded-full flex items-center justify-center text-[16px] font-bold bg-pink-500/20">☝️</div>
            <div className="text-xs">
              <span className="font-bold text-pink-200 block uppercase tracking-wider">指向:</span> 照片靠近观察 (平滑动画)
            </div>
          </div>
          <div className="flex items-center gap-3 text-pink-300/80">
            <div className="w-8 h-8 border-2 border-pink-400/50 rounded-full flex items-center justify-center text-[16px] font-bold bg-pink-500/20">🖐️</div>
            <div className="text-xs">
              <span className="font-bold text-pink-200 block uppercase tracking-wider">滑动手势:</span> 左右挥手快速切换照片
            </div>
          </div>
          <div className="flex items-center gap-3 text-pink-300/80">
            <div className="w-8 h-8 border-2 border-pink-400/50 rounded-full flex items-center justify-center text-[16px] font-bold bg-pink-500/20">👌</div>
            <div className="text-xs">
              <span className="font-bold text-pink-200 block uppercase tracking-wider">捏合 / OK:</span> 切换到下一张照片
            </div>
          </div>
        </div>

        <div className="flex gap-4 pointer-events-auto items-center opacity-60 hover:opacity-100 transition-opacity">
          <div className="flex flex-col items-end">
             <span className="text-[10px] text-pink-500/50 uppercase tracking-tighter">Cinematic Vision Engine</span>
             <span className="text-pink-300 font-bold">Graphic Engineer</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UIOverlay;
