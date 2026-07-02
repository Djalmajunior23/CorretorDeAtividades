import re
with open('src/components/SmartClassDiaryView.tsx', 'r') as f:
    content = f.read()

normalize_fn = """
function normalizeArray<T = any>(value: any): T[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.items)) return value.data.items;
  if (Array.isArray(value?.data?.records)) return value.data.records;
  if (Array.isArray(value?.data?.timeSlots)) return value.data.timeSlots;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.records)) return value.records;
  if (Array.isArray(value?.results)) return value.results;
  if (Array.isArray(value?.timeSlots)) return value.timeSlots;
  return [];
}
"""

if "function normalizeArray" not in content:
    content = content.replace("export default function SmartClassDiaryView", normalize_fn + "\nexport default function SmartClassDiaryView")

# Remove the previously incorrectly placed safe*
safe_code = """
  const safeTimeSlots = normalizeArray(timeSlots);
  const safeClasses = normalizeArray(classes);
  const safeStudents = normalizeArray(students);
  const safeSessions = normalizeArray(sessions);
  const safeCompetencies = normalizeArray(competencies);
  const safeAuditLogs = normalizeArray(auditLogs);
  const safeObservations = normalizeArray(observations);
  const safeAttendanceRecords = normalizeArray(attendanceRecords);
"""
content = content.replace(safe_code, "")

# Insert safe* variables right before `return (`
content = content.replace("  return (\n    <div", safe_code + "\n  return (\n    <div")

with open('src/components/SmartClassDiaryView.tsx', 'w') as f:
    f.write(content)
