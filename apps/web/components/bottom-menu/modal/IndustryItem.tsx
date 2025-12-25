import { ElementType } from 'react';

type IndustryItemProps = {
  label: string;
  iconLabel: ElementType;
  iconClass?: string;
};
const defaultIconClass =
  'h-10 w-10 text-gray-400 transition group-hover:text-gray-800';

export default function IndustryItem({
  label,
  iconLabel,
  iconClass = defaultIconClass,
}: IndustryItemProps) {
  const Icon = iconLabel;
  return (
    <div className="industry-btn group flex flex-col items-center cursor-pointer">
      <figure className="icon">
        <Icon className={iconClass} />
      </figure>
      <p className="text-gray-400 transition group-hover:text-gray-800">
        {label}
      </p>
    </div>
  );
}
