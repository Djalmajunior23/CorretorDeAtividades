with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace("encodeURIComponent(classA))}`)", "encodeURIComponent(classA)}`)")
content = content.replace("encodeURIComponent(classB))}`)", "encodeURIComponent(classB)}`)")
content = content.replace("encodeURIComponent(selectedStudent))}`))", "encodeURIComponent(selectedStudent)}`))")
content = content.replace("encodeURIComponent(selectedCorrectorClass))}`))", "encodeURIComponent(selectedCorrectorClass)}`))")
content = content.replace("correctorClasses.find(c => c.id === selectedCorrectorClass))?.name", "correctorClasses.find(c => c.id === selectedCorrectorClass)?.name")

with open('src/App.tsx', 'w') as f:
    f.write(content)
