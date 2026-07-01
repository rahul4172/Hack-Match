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
    <div className={`relative w-full h-full rounded-[20px] overflow-hidden shadow-2xl group bg-[#0A0A0F] ${className}`}>
      
      {/* 1. Full Bleed Background Photo */}
      <div className="absolute inset-0 w-full h-full">
        {avatar ? (
          <img src={avatar} alt={name} className="w-full h-full object-cover object-center" draggable={false} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1E232B] to-[#12161D] text-[#58A6FF]/20">
            {isIdea ? <Lightbulb className="w-32 h-32" /> : <Code2 className="w-32 h-32" />}
          </div>
        )}
      </div>

      {/* 2. Gradient Overlay (Transparent top -> Solid dark bottom) */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#0A0A0F]/80 to-transparent pointer-events-none transition-colors duration-300 group-hover:from-[#000000]" />

      {/* 3. Content Area (Layered over the bottom portion) */}
      <div className="absolute bottom-0 left-0 w-full p-5 sm:p-6 flex flex-col justify-end z-10">
        
        {/* Header: Name, Age, Tags, Role */}
        <div className="mb-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2 mb-1 drop-shadow-md">
            {name}{age ? `, ${age}` : ''}
            {distance !== undefined && distance !== null ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-medium text-red-300 border border-red-400/30 bg-red-500/20 backdrop-blur-md whitespace-nowrap ml-1 shadow-sm">📍 {distance}km</span>
            ) : isNearYou ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-medium text-red-300 border border-red-400/30 bg-red-500/20 backdrop-blur-md whitespace-nowrap ml-1 shadow-sm">📍 Near You</span>
            ) : null}
          </h2>
          <p className="text-[14px] font-medium text-gray-300 tracking-wide drop-shadow-sm">
            {role}
          </p>
        </div>

        {/* Stats Row (Frosted Glass) */}
        {!isIdea && level !== undefined && xp !== undefined && (
          <div className="flex justify-between items-center bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/10 mb-4 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
            <div className="flex flex-col items-center flex-1">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Level</span>
              <span className="text-[13px] font-mono font-bold flex items-center gap-1.5 text-[#58A6FF]">
                <Target className="w-3.5 h-3.5" />
                {level}
              </span>
            </div>
            <div className="w-[1px] h-8 bg-white/10"></div>
            <div className="flex flex-col items-center flex-1">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">XP</span>
              <span className="text-[13px] font-mono font-bold text-white">
                {xp.toLocaleString()}
              </span>
            </div>
            <div className="w-[1px] h-8 bg-white/10"></div>
            <div className="flex flex-col items-center flex-1">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Badge</span>
              <span className={`text-[13px] font-bold flex items-center gap-1.5 ${badge ? badge.color : 'text-[#3FB950]'}`}>
                {badge && badge.icon ? <badge.icon className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                {badge ? badge.label.split(' ')[0] : 'Novice'}
              </span>
            </div>
          </div>
        )}

        {/* About Section */}
        <div className="mb-4">
          <p className="text-[13px] text-gray-300 leading-relaxed line-clamp-2 drop-shadow-sm">
            {about}
          </p>
        </div>

        {/* Stack / Skills (Frosted Chips) */}
        <div className="flex flex-wrap gap-2">
          {stack.map((s) => (
            <span key={s} className="px-2.5 py-1 text-[11px] font-medium bg-white/5 backdrop-blur-sm text-gray-200 rounded-full border border-white/10 shadow-sm">
              {s}
            </span>
          ))}
          {stack.length === 0 && (
            <span className="px-2.5 py-1 text-[11px] font-medium bg-white/5 backdrop-blur-sm text-gray-400 rounded-full border border-dashed border-white/20">
              No skills yet
            </span>
          )}
        </div>

      </div>
    </div>
  );
}
