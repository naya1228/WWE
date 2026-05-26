interface Props {
  active?: boolean;
}

export default function ProfileBtn(props: Props) {
  return (
    <div class={`w-9 h-9 rounded-full border-2 border-ink flex items-center justify-center shadow-sketch ${props.active ? 'bg-accent' : 'bg-paper'}`}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="8.5" r="3.2" />
        <path d="M5.5 19c1.5-3.5 4-5 6.5-5s5 1.5 6.5 5" />
      </svg>
    </div>
  );
}
