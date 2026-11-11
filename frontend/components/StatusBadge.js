const styles = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-200 text-gray-700',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status] || ''}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
