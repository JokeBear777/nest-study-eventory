export type CreateEventData = {
  hostId: number;
  title: string;
  description: string;
  categoryId: number;
  clubId: number|null;
  cityIds: number[];
  startTime: Date;
  endTime: Date;
  maxPeople: number;
};
