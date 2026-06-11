export interface WeekBlueprint {
  id?: string;
  // required by WeekBlueprintSchema
  name: string;
  group: string;
  // defaultValue [], absent in insert documents
  assignments?: Array<BlueprintAssignmentDAO>;
}

export interface BlueprintAssignmentDAO {
  _id?: string;
  // required by SingleBlueprintSchema
  name: string;
  isoWeekday: number;
  startHour: number;
  startMinute: number;
  durationMinutes: number;
  pickup_point?: string;
  return_point?: string;
  note?: string;
  userGoal?: number;
}
