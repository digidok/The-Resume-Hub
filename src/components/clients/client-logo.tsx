/** Client logo from /public/clients/<slug>.png. Rendered on the server so it is in the page
 * immediately (no flash of text, works without JavaScript). The name is the alt text. */
export function ClientLogo({ slug, name }: { slug: string; name: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/clients/${slug}.png`}
      alt={name}
      loading="lazy"
      className="h-16 w-full max-w-[9rem] rounded-sm object-contain"
    />
  );
}
