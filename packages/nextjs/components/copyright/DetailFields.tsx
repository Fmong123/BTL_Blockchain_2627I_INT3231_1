"use client";

export function DetailField({
  label,
  name,
  value,
  required = false,
  max = 120,
  type = "text",
}: {
  label: string;
  name: string;
  value?: string;
  required?: boolean;
  max?: number;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input
        type={type}
        name={name}
        defaultValue={value}
        required={required}
        maxLength={max}
        className="input w-full"
      />
    </label>
  );
}
