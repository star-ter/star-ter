import LoginButton from '../auth/LoginButton';

type GlobalHeaderProps = {
  leftContent?: React.ReactNode;
  centerContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  className?: string; // for custom container styles
};

export default function GlobalHeader({
  leftContent,
  centerContent,
  rightContent,
  className = '',
}: GlobalHeaderProps) {
  return (
    <header
      className={`fixed top-0 z-50 flex w-full items-center justify-between px-6 py-4 pointer-events-none ${className}`}
    >
      {/* Left Section */}
      <div className="flex items-center pointer-events-auto">{leftContent}</div>

      {/* Center Section */}
      <div className="absolute left-1/2 -translate-x-1/2 pointer-events-auto">
        {centerContent}
      </div>

      {/* Right Section */}
      <div className="flex items-center pointer-events-auto">
        {rightContent || <LoginButton />}
      </div>
    </header>
  );
}
