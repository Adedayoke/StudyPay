import { Suspense } from "react";
import StudentDashboardContent from "./StudentDashboardContent";


export default function StudentDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-student-gradient flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
      <StudentDashboardContent />
    </Suspense>
  );
}
