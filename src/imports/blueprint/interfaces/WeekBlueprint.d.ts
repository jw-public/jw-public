export interface WeekBlueprint {
  id?: string;
  name?: string;
  group?: string;
  assignments?: Array<BlueprintAssignmentDAO>;
}

export interface BlueprintAssignmentDAO {
  _id?: string;
  name?: string;
  isoWeekday?: number;
  startHour: number;
  startMinute: number;
  durationMinutes: number;
  pickup_point?: string;
  return_point?: string;
  note?: string;
  userGoal?: number;
}
