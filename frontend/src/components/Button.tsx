import type { JSX } from 'solid-js';
import { isAccentDark } from '../store';

interface Props {
  children: JSX.Element;
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  wide?: boolean;
  onClick?: () => void;
  class?: string;
}

const SIZE: Record<string, string> = {
  sm: 'py-2 px-3 text-sm rounded-[10px]',
  md: 'py-3 px-4 text-[17px] rounded-[14px]',
  lg: 'py-4 px-5 text-[19px] rounded-2xl',
};

const VARIANT: Record<string, string> = {
  primary: 'bg-accent border-2 border-ink shadow-sketch-md',
  outline: 'bg-paper border-2 border-ink shadow-sketch',
  ghost: 'border-0',
};

export default function Button(props: Props) {
  const variant = () => props.variant ?? 'primary';
  const size = () => props.size ?? 'md';
  const wide = () => props.wide !== false;

  return (
    <button
      onClick={props.onClick}
      class={`
        cursor-pointer font-kalam font-bold leading-tight text-center
        ${variant() === 'primary' && isAccentDark() ? 'text-white' : 'text-ink'}
        flex items-center justify-center gap-2
        active:translate-y-[1px] active:shadow-none transition-[transform,box-shadow] duration-75
        ${VARIANT[variant()]}
        ${SIZE[size()]}
        ${wide() ? 'w-full' : 'w-auto'}
        ${props.class ?? ''}
      `}
    >
      {props.children}
    </button>
  );
}
