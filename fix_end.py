import re
with open('src/App.tsx', 'r') as f:
    content = f.read()

# find </main> and replace the preceding </div> with </ErrorBoundary></div>
# Let's use regex
content = re.sub(r'</div>\s*</main>', '</ErrorBoundary>\n        </div>\n      </main>', content)

with open('src/App.tsx', 'w') as f:
    f.write(content)
