import re
with open('src/components/SmartClassDiaryView.tsx', 'r') as f:
    content = f.read()

fallback = """
          {safeTimeSlots.length === 0 && (
            <div className="p-4 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-xl mb-4 text-center">
              Nenhum horário disponível para exibição no calendário.
            </div>
          )}
"""

# Insert after <div id="subtab-calendar" className="space-y-6">
content = content.replace(
    '<div id="subtab-calendar" className="space-y-6">',
    '<div id="subtab-calendar" className="space-y-6">' + fallback
)

with open('src/components/SmartClassDiaryView.tsx', 'w') as f:
    f.write(content)
