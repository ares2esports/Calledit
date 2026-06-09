export const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-emerald-100 ${className}`}>{children}</div>
);

export const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const styles = {
    primary: 'bg-emerald-700 text-white hover:bg-emerald-800 disabled:bg-emerald-300',
    secondary: 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200',
    ghost: 'text-emerald-800 hover:bg-emerald-100',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };
  return (
    <button
      className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition active:scale-[.98] disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const Input = ({ className = '', ...props }) => (
  <input
    className={`w-full px-4 py-2.5 rounded-xl border border-emerald-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${className}`}
    {...props}
  />
);

export const Badge = ({ children, color = 'emerald' }) => {
  const colors = {
    emerald: 'bg-emerald-100 text-emerald-800',
    amber: 'bg-amber-100 text-amber-800',
    red: 'bg-red-100 text-red-800',
    gray: 'bg-gray-100 text-gray-700',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${colors[color]}`}>
      {children}
    </span>
  );
};

export const Spinner = () => (
  <div className="flex justify-center py-10">
    <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-700 rounded-full animate-spin" />
  </div>
);
