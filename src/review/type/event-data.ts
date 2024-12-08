export type EventData = {
  id: number;
  hostId: number;
  title: string;
  description: string;
  categoryId: number;
  clubId: number | null;
  startTime: Date;
  endTime: Date;
  maxPeople: number;
  eventCity: {
    id: number;
    cityId: number;
  }[];
  isArchived: boolean;
};
