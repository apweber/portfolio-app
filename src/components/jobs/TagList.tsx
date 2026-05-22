export function TagList({ tags }: { tags: string[] }) {
  if (!tags.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
