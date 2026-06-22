export default function Card({ title, desc, tag }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        {tag && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            {tag}
          </span>
        )}
      </div>
      <p className="text-gray-600 leading-relaxed">{desc}</p>
    </div>
  );
}