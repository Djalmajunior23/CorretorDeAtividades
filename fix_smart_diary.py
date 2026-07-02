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
    # insert it right after the imports
    content = content.replace('export function SmartClassDiaryView() {', normalize_fn + '\nexport function SmartClassDiaryView() {')

# Find all the "const [xxx, setXxx] = useState"
# Let's just create the safe variables at the beginning of the component
safe_vars = """
  const safeTimeSlots = normalizeArray(timeSlots);
  const safeClasses = normalizeArray(classes);
  const safeStudents = normalizeArray(students);
  const safeSessions = normalizeArray(sessions);
  const safeCompetencies = normalizeArray(competencies);
  const safeAuditLogs = normalizeArray(auditLogs);
  const safeObservations = normalizeArray(observations);
  const safeAttendanceRecords = normalizeArray(attendanceRecords);
"""

# Insert right after the useState for aiSummaryResult
content = content.replace("const [aiSummaryResult, setAiSummaryResult] = useState<any>(null);", "const [aiSummaryResult, setAiSummaryResult] = useState<any>(null);\n" + safe_vars)

# Replace all usages
content = re.sub(r'\btimeSlots\.find\b', 'safeTimeSlots.find', content)
content = re.sub(r'\btimeSlots\.map\b', 'safeTimeSlots.map', content)
content = re.sub(r'\btimeSlots\.filter\b', 'safeTimeSlots.filter', content)
content = re.sub(r'\btimeSlots\.length\b', 'safeTimeSlots.length', content)

content = re.sub(r'\bclasses\.map\b', 'safeClasses.map', content)
content = re.sub(r'\bclasses\.find\b', 'safeClasses.find', content)
content = re.sub(r'\bclasses\.filter\b', 'safeClasses.filter', content)

content = re.sub(r'\bstudents\.map\b', 'safeStudents.map', content)
content = re.sub(r'\bstudents\.find\b', 'safeStudents.find', content)
content = re.sub(r'\bstudents\.filter\b', 'safeStudents.filter', content)

content = re.sub(r'\bsessions\.map\b', 'safeSessions.map', content)
content = re.sub(r'\bsessions\.find\b', 'safeSessions.find', content)
content = re.sub(r'\bsessions\.filter\b', 'safeSessions.filter', content)
content = re.sub(r'\bsessions\.length\b', 'safeSessions.length', content)

content = re.sub(r'\bcompetencies\.map\b', 'safeCompetencies.map', content)
content = re.sub(r'\bcompetencies\.find\b', 'safeCompetencies.find', content)

content = re.sub(r'\bauditLogs\.map\b', 'safeAuditLogs.map', content)
content = re.sub(r'\bauditLogs\.find\b', 'safeAuditLogs.find', content)
content = re.sub(r'\bauditLogs\.length\b', 'safeAuditLogs.length', content)

content = re.sub(r'\bobservations\.map\b', 'safeObservations.map', content)
content = re.sub(r'\bobservations\.find\b', 'safeObservations.find', content)
content = re.sub(r'\bobservations\.filter\b', 'safeObservations.filter', content)
content = re.sub(r'\bobservations\.length\b', 'safeObservations.length', content)

content = re.sub(r'\battendanceRecords\.map\b', 'safeAttendanceRecords.map', content)
content = re.sub(r'\battendanceRecords\.find\b', 'safeAttendanceRecords.find', content)
content = re.sub(r'\battendanceRecords\.filter\b', 'safeAttendanceRecords.filter', content)
content = re.sub(r'\battendanceRecords\.length\b', 'safeAttendanceRecords.length', content)

with open('src/components/SmartClassDiaryView.tsx', 'w') as f:
    f.write(content)
