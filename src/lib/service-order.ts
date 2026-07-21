import type { ApiCategory, ApiService } from "@/lib/api-types";

const SERVICE_PRIORITY = [
  ["electrician", "electrical"],
  ["plumber", "plumbing"],
  ["carpenter", "carpentry"],
  ["home-cleaning", "home cleaning", "home service"],
  ["painter", "painting"],
] as const;

function priorityFor(searchable: string) {
  const normalized = searchable.toLowerCase();
  const index = SERVICE_PRIORITY.findIndex((keywords) =>
    keywords.some((keyword) => normalized.includes(keyword)),
  );
  return index === -1 ? SERVICE_PRIORITY.length : index;
}

export function orderServices(services: ApiService[]) {
  return services
    .map((service, index) => ({ service, index }))
    .sort((a, b) =>
      priorityFor(`${a.service.category_id} ${a.service.title}`) -
        priorityFor(`${b.service.category_id} ${b.service.title}`) ||
      a.index - b.index,
    )
    .map(({ service }) => service);
}

export function orderCategories(categories: ApiCategory[]) {
  return categories
    .map((category, index) => ({ category, index }))
    .sort((a, b) =>
      priorityFor(`${a.category.id} ${a.category.title}`) -
        priorityFor(`${b.category.id} ${b.category.title}`) ||
      a.index - b.index,
    )
    .map(({ category }) => category);
}
