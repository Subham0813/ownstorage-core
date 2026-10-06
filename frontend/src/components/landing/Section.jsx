import { useReveal } from "../../hooks/useReveal";

export function Section({ children, className = "", id }) {
  const [ref, visible] = useReveal();
  return (
    <section
      id={id}
      ref={ref}
      className={`transition-all duration-700 ease-out scroll-mt-28 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      } ${className}`}
    >
      {children}
    </section>
  );
}
