
import { Target, Check, Lightbulb, Code2 } from 'lucide-react';

export interface UserProfileCardProps {
  name: string;
  age?: number;
  role: string;
  avatar?: string;
  level?: number;
  xp?: number;
  badge?: { label: string; icon: any; color: string };
  about: string;
  stack: string[];
  isIdea?: boolean;
  distance?: number | null;
  isNearYou?: boolean;
  className?: string;
}

export function UserProfileCard({
  name,
  age,
  role,
  avatar,
  level,
  xp,
  badge,
  about,
  stack,
  isIdea,
  distance,
  isNearYou,
  className = '',
}: UserProfileCardProps) {
  return (
    <div className={`flex flex-col w-full h-full bg-gradient-to-b from-[#1E232B] to-[#12161D] rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08)] border border-white/5 p-6 overflow-hidden ${className}`}>
      
      {/* 1. Photo Top */}
      <div className="flex justify-center mb-5 shrink-0">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[20px] overflow-hidden border border-white/10 shadow-[0_8px_20px_rgba(0,0,0,0.4)] bg-[#0D1117] flex items-center justify-center">
          {avatar ? (
            <img src={avatar} alt={name} className="w-full h-full object-cover" draggable={false} />
          ) : (
            <div className="text-[#58A6FF]/20">
              {isIdea ? <Lightbulb className="w-12 h-12" /> : <Code2 className="w-12 h-12" />}
            </div>
          )}
        </div>
      </div>

      {/* 2. Header */}
      <div className="text-center mb-5 shrink-0">
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center justify-center gap-2 mb-1.5 leading-tight">
          {name}{age ? `, ${age}` : ''}
          {distance !== undefined && distance !== null ? (
            <span className="text-[10px] px-2 py-0.5 rounded-md font-mono font-medium text-red-300 border border-red-400/30 bg-red-500/10 whitespace-nowrap">📍 {distance}km</span>
          ) : isNearYou ? (
            <span className="text-[10px] px-2 py-0.5 rounded-md font-mono font-medium text-red-300 border border-red-400/30 bg-red-500/10 whitespace-nowrap">📍 Near You</span>
          ) : null}
        </h2>
        <p className="text-[13px] font-medium text-[#8B949E] tracking-wide">
          {role}
        </p>
      </div>

      {/* 3. Stats Row */}
      {!isIdea && level !== undefined && xp !== undefined && (
        <div className="flex justify-between items-center bg-[#050505]/40 rounded-[16px] p-3.5 border border-white/5 mb-5 shrink-0 shadow-inner">
          <div className="flex flex-col items-center flex-1">
            <span className="text-[10px] text-[#6E7681] uppercase tracking-widest font-bold mb-1">Level</span>
            <span className="text-[13px] font-mono font-bold flex items-center gap-1.5 text-[#58A6FF]">
              <Target className="w-3.5 h-3.5" />
              {level}
            </span>
          </div>
          <div className="w-[1px] h-8 bg-white/10"></div>
          <div className="flex flex-col items-center flex-1">
            <span className="text-[10px] text-[#6E7681] uppercase tracking-widest font-bold mb-1">XP</span>
            <span className="text-[13px] font-mono font-bold text-white">
              {xp.toLocaleString()}
            </span>
          </div>
          <div className="w-[1px] h-8 bg-white/10"></div>
          <div className="flex flex-col items-center flex-1">
            <span className="text-[10px] text-[#6E7681] uppercase tracking-widest font-bold mb-1">Badge</span>
            <span className={`text-[13px] font-bold flex items-center gap-1.5 ${badge ? badge.color : 'text-[#3FB950]'}`}>
              {badge && badge.icon ? <badge.icon className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
              {badge ? badge.label.split(' ')[0] : 'Novice'}
            </span>
          </div>
        </div>
      )}

      {/* 4. About */}
      <div className="mb-5 flex-1 min-h-[60px] flex flex-col">
        <h4 className="text-[10px] font-bold text-[#6E7681] uppercase tracking-widest mb-2 shrink-0">About</h4>
        <p className="text-[13px] text-[#C9D1D9] leading-relaxed line-clamp-4 overflow-hidden">
          {about}
        </p>
      </div>

      {/* 5. Stack / Skills */}
      <div className="shrink-0 mt-auto pt-2">
        <h4 className="text-[10px] font-bold text-[#6E7681] uppercase tracking-widest mb-2.5">Stack</h4>
        <div className="flex flex-wrap gap-2">
          {stack.map((s) => (
            <span key={s} className="px-2.5 py-1 text-[11px] font-medium bg-[#58A6FF]/10 text-[#58A6FF] rounded-lg border border-[#58A6FF]/20">
              {s}
            </span>
          ))}
          {stack.length === 0 && (
            <span className="text-[11px] text-[#6E7681] italic">No stack provided</span>
          )}
        </div>
      </div>
    </div>
  );
}
