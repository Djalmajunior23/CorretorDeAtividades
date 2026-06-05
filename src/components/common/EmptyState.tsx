import { FilePlus } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText: string;
  onAction: () => void;
}

export default function EmptyState({ title, description, actionText, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center p-6 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
      <div className="bg-blue-50 p-4 rounded-full mb-4">
        <FilePlus className="text-blue-600" size={24} />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 mt-1 max-w-sm">{description}</p>
      <button 
        onClick={onAction}
        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
      >
        {actionText}
      </button>
    </div>
  );
}
