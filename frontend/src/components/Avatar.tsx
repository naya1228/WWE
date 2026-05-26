interface Props {
  size?: number;
  label?: string;
  accent?: boolean;
}

export default function Avatar(props: Props) {
  const size = () => props.size ?? 64;
  return (
    <div
      class={`rounded-full border-[2.5px] border-ink flex items-center justify-center font-caveat font-bold shadow-sketch-md shrink-0 ${props.accent ? 'bg-accent' : 'bg-paper'}`}
      style={{
        width: `${size()}px`,
        height: `${size()}px`,
        'font-size': `${size() * 0.4}px`,
      }}
    >
      {props.label}
    </div>
  );
}
