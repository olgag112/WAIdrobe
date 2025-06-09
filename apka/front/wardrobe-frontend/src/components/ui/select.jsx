export function Select({ value, onValueChange, children }) {
    return (
      <select
        className="w-full border border-gray-300 rounded px-2 py-1"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
      >
        {children}
      </select>
    );
  }
  
  export function SelectItem({ value, children }) {
    return <option value={value}>{children}</option>;
  }
  
  export function SelectTrigger({ children }) {
    return <>{children}</>;
  }
  
  export function SelectValue() {
    return null;
  }
  
  export function SelectContent({ children }) {
    return <>{children}</>;
  }
  