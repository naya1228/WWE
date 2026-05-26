interface Props {
  label?: string;
  value?: string;
  placeholder?: string;
  onInput?: (v: string) => void;
  type?: string;
}

export default function Input(props: Props) {
  return (
    <label class="flex flex-col gap-1">
      {props.label && (
        <span class="text-sm text-ink-soft pl-1">{props.label}</span>
      )}
      <span class="flex items-center gap-2 border-2 border-ink rounded-xl px-3.5 py-2.5 bg-paper shadow-sketch min-h-[42px]">
        <input
          type={props.type ?? 'text'}
          value={props.value ?? ''}
          placeholder={props.placeholder}
          onInput={e => props.onInput?.(e.currentTarget.value)}
        />
      </span>
    </label>
  );
}
