export type TagType = 'must' | 'want';

export interface Tag {
  id: string;
  label: string;
  type: TagType;
  createdAt: string;
}

export interface PropertyRating {
  userId: 'partner1' | 'partner2';
  stars: number;
  compromise: string;
}

export interface Property {
  id: string;
  name: string;
  rent: number;
  layout: string;
  sqm: number;
  url: string;
  address: string;
  metAt: string;
  mustTagIds: string[];
  ratings: PropertyRating[];
  imageUrl?: string;
}

export type DayType = 'weekday' | 'weekend';

export interface RoutineBlock {
  id: string;
  startHour: number;
  endHour: number;
  label: string;
  color: string;
  userId: 'partner1' | 'partner2' | 'both';
  note: string;
  requiredFeatures: string[];
}

export interface RoutineDay {
  id: string;
  dayType: DayType;
  blocks: RoutineBlock[];
}
