import { Suspense } from "react";
import { WorkHoursHistory } from "./components/work-hours-history";
import { SessionLoading } from "../components/session-loading";

export default function HorariosPage() {
  return <Suspense fallback={<SessionLoading />}><WorkHoursHistory /></Suspense>;
}
