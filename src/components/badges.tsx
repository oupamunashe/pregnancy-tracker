import type { Task } from "@/lib/schemas";
import type { TaskStatus } from "@/lib/engine/gestation";
import { Chip, type Tone } from "./ui";

const CAT: Record<Task["category"], Tone> = { Prenatal: "soft", Finance: "brassSoft", Doctor: "sky", Exercise: "done" };
const URG: Record<Task["urgency"], Tone> = { High: "brass", Medium: "brassSoft", Low: "gray" };
const STATUS: Record<TaskStatus, Tone> = { Done: "done", Overdue: "brass", "This week": "primary", Upcoming: "gray" };

export const CategoryChip = ({ value }: { value: Task["category"] }) => <Chip tone={CAT[value]}>{value}</Chip>;
export const UrgencyChip = ({ value }: { value: Task["urgency"] }) => <Chip tone={URG[value]}>{value}</Chip>;
export const StatusChip = ({ value }: { value: TaskStatus }) => <Chip tone={STATUS[value]}>{value}</Chip>;
