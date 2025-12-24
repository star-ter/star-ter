type PillButtonProps = {
  label: string;
  onClick: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string; // 선택
};

export default function PillButton({
  label,
  onClick,
  type = 'button',
  className = '',
}: PillButtonProps) {
  const baseClass =
    'rounded-full bg-white/90 px-4 py-2 text-sm text-gray-800 shadow-sm ring-1 ring-gray-200 transition hover:bg-gray-100 cursor-pointer';
  return (
    <button
      className={`${baseClass} ${className}`}
      type={type}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
