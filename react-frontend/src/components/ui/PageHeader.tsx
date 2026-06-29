import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  gradient?: string;
  action?: React.ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  gradient = 'from-[#58A6FF] via-[#BC8CFF] to-[#FF7B72]',
  action,
}: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 sm:mb-10"
    >
      <div>
        <h1 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r ${gradient} tracking-tight`}>
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-sm sm:text-base text-[#8B949E] font-mono max-w-xl">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0 w-full sm:w-auto">{action}</div>}
    </motion.div>
  );
}
