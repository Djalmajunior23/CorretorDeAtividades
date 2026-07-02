import re
with open('src/components/SmartClassDiaryView.tsx', 'r') as f:
    lines = f.readlines()

# Remove old safe* declarations
safe_code = [
    "  const safeTimeSlots = normalizeArray(timeSlots);\n",
    "  const safeClasses = normalizeArray(classes);\n",
    "  const safeStudents = normalizeArray(students);\n",
    "  const safeSessions = normalizeArray(sessions);\n",
    "  const safeCompetencies = normalizeArray(competencies);\n",
    "  const safeAuditLogs = normalizeArray(auditLogs);\n",
    "  const safeObservations = normalizeArray(observations);\n",
    "  const safeAttendanceRecords = normalizeArray(attendanceRecords);\n"
]

lines = [line for line in lines if line not in safe_code]

# Find line 167 (after all the useStates) and insert safe_code
lines.insert(168, "".join(safe_code))

with open('src/components/SmartClassDiaryView.tsx', 'w') as f:
    f.writelines(lines)
