import { Trophy, Code2, Globe, Sparkles } from 'lucide-react';

export function calculateLevelData(hack_score: number = 0) {
  const XP_PER_LEVEL = 50;
  const level = Math.floor(hack_score / XP_PER_LEVEL) + 1;
  
  const prevLevelXP = (level - 1) * XP_PER_LEVEL;
  const nextLevelXP = level * XP_PER_LEVEL;
  
  const xpIntoCurrentLevel = hack_score - prevLevelXP;
  const progressPercent = (xpIntoCurrentLevel / XP_PER_LEVEL) * 100;

  let rank = 'Novice';
  let rankColor = 'text-slate-400';
  let rankBorder = 'border-slate-400/30';
  let rankBg = 'bg-slate-400/10';

  if (level >= 15) {
    rank = 'Master';
    rankColor = 'text-red-400';
    rankBorder = 'border-red-400/30';
    rankBg = 'bg-red-400/10';
  } else if (level >= 10) {
    rank = 'Architect';
    rankColor = 'text-[#BC8CFF]';
    rankBorder = 'border-[#BC8CFF]/30';
    rankBg = 'bg-[#BC8CFF]/10';
  } else if (level >= 6) {
    rank = 'Developer';
    rankColor = 'text-[#3FB950]';
    rankBorder = 'border-[#3FB950]/30';
    rankBg = 'bg-[#3FB950]/10';
  } else if (level >= 3) {
    rank = 'Apprentice';
    rankColor = 'text-[#58A6FF]';
    rankBorder = 'border-[#58A6FF]/30';
    rankBg = 'bg-[#58A6FF]/10';
  }

  return {
    level,
    xp: hack_score,
    nextLevelXP,
    progressPercent: Math.min(100, Math.max(0, progressPercent)),
    rank,
    rankColor,
    rankBorder,
    rankBg
  };
}

export function generateBadges(user: any) {
  const badges = [];

  // Hackathon Winner
  if (user.winnings && user.winnings.length > 5 && user.winnings.toLowerCase().match(/(winner|1st|2nd|3rd|won|prize)/)) {
    badges.push({
      id: 'winner',
      label: 'Hackathon Winner',
      icon: Trophy,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      shadowColor: 'rgba(234,179,8,0.8)',
    });
  }

  // Open Source Contributor
  if (user.github && user.github.length > 5) {
    badges.push({
      id: 'opensource',
      label: 'Code Contributor',
      icon: Code2,
      color: 'text-[#BC8CFF]',
      bgColor: 'bg-[#BC8CFF]/10',
      shadowColor: 'rgba(188,140,255,0.8)',
    });
  }

  // Networker
  if (user.hack_score > 50) {
    badges.push({
      id: 'networker',
      label: 'Networker',
      icon: Globe,
      color: 'text-[#58A6FF]',
      bgColor: 'bg-[#58A6FF]/10',
      shadowColor: 'rgba(88,166,255,0.8)',
    });
  }
  
  // Early Adopter / Default
  if (badges.length === 0) {
    badges.push({
      id: 'early',
      label: 'Early Adopter',
      icon: Sparkles,
      color: 'text-[#3FB950]',
      bgColor: 'bg-[#3FB950]/10',
      shadowColor: 'rgba(63,185,80,0.8)',
    });
  }

  return badges;
}
