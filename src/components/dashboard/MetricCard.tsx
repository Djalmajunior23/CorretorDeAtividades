import { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface MetricCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  color: string;
}

export default function MetricCard({ title, value, icon: Icon, color }: MetricCardProps) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}                
      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow"
    >
      <div className={`p-4 rounded-2xl ${color} text-white shadow-sm`}>
        <Icon size={24} />
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
    </motion.div>
  );
}
