import type { JSX } from 'solid-js';

interface Props {
  children: JSX.Element;
  dashed?: boolean;
  accent?: boolean;
  onClick?: () => void;
  class?: string;
}

export default function Card(props: Props) {
  return (
    <div
      onClick={props.onClick}
      class={`
        border-2 border-ink rounded-xl p-3
        ${props.dashed ? 'border-dashed' : 'shadow-sketch'}
        ${props.accent ? 'bg-accent-soft' : 'bg-paper'}
        ${props.onClick ? 'cursor-pointer' : ''}
        ${props.class ?? ''}
      `}
    >
      {props.children}
    </div>
  );
}
