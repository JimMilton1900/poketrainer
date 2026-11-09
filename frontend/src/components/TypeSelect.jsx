import { useFetch } from '../hooks/useFetch.js';
import { pretty } from '../utils/format.js';

// valueKey: 'name' for filters, 'id' for forms that store favorite_type_id
export default function TypeSelect({ value, onChange, valueKey = 'name', placeholder = 'All types', className = '' }) {
  const { data } = useFetch('/types');
  return (
    <select className={`select ${className}`} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {data?.map((t) => <option key={t.id} value={t[valueKey]}>{pretty(t.name)}</option>)}
    </select>
  );
}